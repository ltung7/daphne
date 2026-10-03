import { getVehicle, updateVehicle } from '../db/firebase/vehicles.fdb';
import { error } from "@sveltejs/kit";
import { addVehicleStatusChange } from '../db/firebase/vehicleStatusChange.fdb';
import { vehicleRequirements } from '$lib/assets/requirements';
import { sendVehicleStatusChangedNotification } from '../notifications/vehicle/vehicleStatusNotifications';
import { getDriver } from '../db/firebase/drivers.fdb';

type TransitionHandler = (vehicle: Vehicle.Vehicle, extraData: any) => Promise<boolean> | boolean;

const statusTransitions: Partial<Record<Vehicle.Status, Partial<Record<Vehicle.Status, TransitionHandler>>>> = {
	precheck: {
		available: async (vehicle, extraData) => {
			if (!extraData.verificationResult) throw error(400, 'Missing verification data');

			// Get all required requirement nodes
			const requiredNodes = vehicleRequirements
				.filter(req => req.required)
				.map(req => req.node);

			// Check all required requirements are satisfied
			const allRequiredMet = requiredNodes.every(node => extraData.verificationResult[node] === true);

			if (!allRequiredMet) {
				const failedRequirements = requiredNodes
					.filter(node => extraData.verificationResult[node] !== true)
					.map(node => {
						const req = vehicleRequirements.find(r => r.node === node);
						return req?.name || node;
					});
				throw error(400, `Verification failed. Missing requirements: ${failedRequirements.join(', ')}`);
			}
			return false; // not critical
		},
		broken: () => true, // critical
		under_maintenance: () => false, // not critical
		unmovable: () => true // critical
	},
	available: {
		under_maintenance: () => false,
		broken: () => true,
		unmovable: () => true,
		retired: () => false
	},
	assigned: {
		broken: () => true,
		unmovable: () => true
	},
	under_maintenance: {
		available: () => false,
		broken: () => false,
		unmovable: () => true
	},
	broken: {
		available: () => true,
		under_maintenance: () => false,
		unmovable: () => true
	},
	unmovable: {
		available: () => true,
		under_maintenance: () => false,
		broken: () => true
	},
	retired: {
		precheck: () => false
	}
};

export const handleChangeVehicleStatus = async (vehicleOrId: string | Vehicle.Vehicle, newStatus: Vehicle.Status, extraData: any, user: App.User) => {
	const vehicle = typeof vehicleOrId === 'string' ? await getVehicle(vehicleOrId) : vehicleOrId;
	if (!vehicle) throw error(404, 'Vehicle not found');

	// Only restriction: moderator cannot retire
	if (user.role === 'moderator' && newStatus === 'retired') {
		throw error(403, 'Moderator cannot retire vehicle');
	}

	const currentStatus = vehicle.status;
	if (currentStatus === newStatus) return { success: true, status: newStatus };

	const allowedTransitionsFromCurrent = statusTransitions[currentStatus];
	if (!allowedTransitionsFromCurrent) {
		throw error(400, `No transitions defined from current status: ${currentStatus}`);
	}

	const transitionHandler = allowedTransitionsFromCurrent[newStatus];
	if (!transitionHandler) {
		throw error(400, `Invalid status transition from ${currentStatus} to ${newStatus}`);
	}

	let isCritical = false;
	// Run custom transition checks if a handler exists
	try {
		isCritical = Boolean(await transitionHandler(vehicle, extraData));
	} catch (err: any) {
		if (err?.status && err?.body?.message) throw err; // Re-throw SvelteKit errors
		throw error(400, `Failed to transition status: ${err.message || 'Unknown error'}`);
	}

	if (newStatus === 'available' && vehicle.assignedDriverId) {
		newStatus = 'assigned';
	}

	const statusChangeExtraData = {
		...extraData,
		userId: user.id,
		userName: user.name
	};
	await updateVehicle(vehicle.id, { status: newStatus });
	await addVehicleStatusChange({ extraData: statusChangeExtraData, vehicleId: vehicle.id, status: newStatus, timestamp: Date.now(), userId: user.id, userName: user.name });
	
	let driverContact: App.BaseContact | null = null;
	if (isCritical && vehicle.assignedDriverId) {
		const driver = await getDriver(vehicle.assignedDriverId);
		if (driver) {
			driverContact = {
				id: driver.id,
				email: driver.email,
				name: driver.name,
				preferredLanguage: driver.preferredLanguage,
				phone: driver.phone,
				fcmToken: driver.fcmToken
			};
		}
	}

	await sendVehicleStatusChangedNotification(driverContact, {
		registrationNumber: vehicle.registrationNumber,
		previousStatus: currentStatus,
		newStatus: newStatus,
		reason: extraData?.reason || extraData?.note || 'Status updated manually',
		userId: user.id,
		userName: user.name
	}, isCritical, extraData?.source || 'system').catch(err => {
		console.error('Failed to send status change notification', err);
	});

	return { success: true, status: newStatus };
};