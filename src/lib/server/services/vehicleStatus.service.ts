import { db } from '$lib/server/db/firebase/firebase';
import { getVehicle, updateVehicle } from '../db/firebase/vehicles.fdb';
import admin from 'firebase-admin';
import { insertRandomLog } from '../db/tables/randomLogs.db';
import { error } from "@sveltejs/kit";
import { addVehicleStatusChange } from '../db/firebase/vehicleStatusChange.fdb';
import { vehicleRequirements } from '$lib/assets/requirements';

export interface AssignVehicleData {
	registrationNumber: string; // registration number
	driverId: string;
	driverName: string;
	handoverId: string;
	approver: { id: string; name: string };
	model?: string;
	imageUrl?: string;
	uploadedDocumentUrl?: string
}

/**
 * Atomically assigns a vehicle to a driver and closes the handover in a single Firestore transaction.
 * Updates:
 * 1. Vehicle document - assignedDriverName, assignedDriverId
 * 2. Driver document - assignedVehicle
 * 3. Creates vehicleAssignment record
 * 4. Sets vehicleHandovers.closed = Date.now()
 */
export async function assignVehicleAndCloseHandover(data: AssignVehicleData): Promise<{ success: boolean; assignmentId?: string; error?: string }> {
	const { registrationNumber, driverId, driverName, handoverId, uploadedDocumentUrl, approver } = data;
	let model = data.model;
	let imageUrl = data.imageUrl
	if (!model || !imageUrl) {
		const vehicle = await getVehicle(registrationNumber);
		if (!vehicle) throw new Error("Vehicle does not exist");
		model = vehicle.name;
		imageUrl = vehicle.imageUrl;
	}
	const firestore = db();
	const timestamp = Date.now();

	const updateVehicleData: Partial<Vehicle.Vehicle> = {
		assignedDriverId: driverId,
		assignedDriverName: driverName,
		handoverId: handoverId,
		status: 'assigned'
	}
	const updateDriverData: Partial<Driver.Driver> = {
		assignedVehicle: {
			model,
			registrationNumber,
			timestamp,
			handoverId
		}
	}
	if (imageUrl && updateDriverData.assignedVehicle) updateDriverData.assignedVehicle.imageUrl = imageUrl;

	const vehicleAssignmentData: Vehicle.VehicleAssignmentData = {
		driverId,
		handoverId,
		registrationNumber,
		timestamp,
		type: 'assign'
	}

	const updateHandoverData: Partial<DocumentGenerator.HandoverDocumentRecord> = {
		closed: timestamp
	}
	if (uploadedDocumentUrl?.length) updateHandoverData.url = uploadedDocumentUrl;

	insertRandomLog('AssignTransaction', { updateVehicleData, updateDriverData, vehicleAssignmentData, updateHandoverData })
	try {
		await firestore.runTransaction(async (transaction) => {
			// 1. Update vehicle document
			const vehicleRef = firestore.collection('vehicles').doc(registrationNumber);
			transaction.update(vehicleRef, updateVehicleData);

			// 2. Update driver document
			const driverRef = firestore.collection('vehicleDriver').doc(driverId);
			transaction.update(driverRef, updateDriverData);

			// 3. Create vehicle assignment record
			const assignmentRef = firestore.collection('vehicleAssignment').doc();
			transaction.set(assignmentRef, vehicleAssignmentData);

			// 4. Close the vehicle handover
			const handoverRef = firestore.collection('vehicleHandovers').doc(handoverId);
			transaction.update(handoverRef, updateHandoverData);

			// Return assignment ID for caller reference
			return assignmentRef.id;
		});

		await addVehicleStatusChange({
			extraData: { handoverId },
			vehicleId: registrationNumber,
			status: 'assigned',
			timestamp,
			userId: approver.id,
			userName: approver.name
		});

		return { success: true };
	} catch (error) {
		console.error('Transaction failed:', error);
		return {
			success: false,
			error: error instanceof Error ? error.message : 'Unknown transaction error'
		};
	}
}

export interface ReturnVehicleData {
	registrationNumber: string;
	driverId?: string;
	handoverId: string;
	uploadedDocumentUrl?: string;
	approver: { id: string; name: string };
	originalHandoverId?: string;
}

export interface UnilateralReturnVehicleData {
	registrationNumber: string;
	driverId?: string;
	handoverId: string;
	uploadedDocumentUrl?: string;
	approver: { id: string; name: string };
	originalHandoverId?: string;
}

async function closeReturnHandover(
	data: ReturnVehicleData,
	type: 'return' | 'unilateral'
): Promise<{ success: boolean; assignmentId?: string; error?: string }> {
	const { registrationNumber, handoverId, uploadedDocumentUrl, approver } = data;
	const vehicle = await getVehicle(registrationNumber);
	if (!vehicle) throw new Error('Vehicle does not exist');

	const driverId = data.driverId || vehicle.assignedDriverId;
	if (!driverId) throw new Error('Vehicle is not assigned to a driver');

	const firestore = db();
	const timestamp = Date.now();

	// Deterministic status: status stays the same unless it was 'assigned' (becomes 'available')
	const newStatus: Vehicle.Status = vehicle.status === 'assigned' ? 'available' : vehicle.status;

	const updateVehicleData: any = {
		assignedDriverId: admin.firestore.FieldValue.delete(),
		assignedDriverName: admin.firestore.FieldValue.delete(),
		handoverId: admin.firestore.FieldValue.delete(),
		status: newStatus,
		updatedAt: timestamp
	};

	const updateDriverData: Partial<Driver.Driver> = {
		assignedVehicle: false,
		updatedAt: timestamp
	};

	const vehicleAssignmentData: Vehicle.VehicleAssignmentData = {
		driverId,
		handoverId,
		registrationNumber,
		timestamp,
		type
	};

	const updateHandoverData: Partial<DocumentGenerator.HandoverDocumentRecord> = {
		closed: timestamp
	};
	if (uploadedDocumentUrl?.length) updateHandoverData.url = uploadedDocumentUrl;
	if (data.originalHandoverId) updateHandoverData.handoverId = data.originalHandoverId;

	const logTag = type === 'unilateral' ? 'UnilateralReturnTransaction' : 'ReturnTransaction';
	insertRandomLog(logTag, { updateVehicleData, updateDriverData, vehicleAssignmentData, updateHandoverData });

	try {
		const assignmentId = await firestore.runTransaction(async (transaction) => {
			// 1. Update vehicle document - clear driver assignment fields & update status
			const vehicleRef = firestore.collection('vehicles').doc(registrationNumber);
			transaction.update(vehicleRef, updateVehicleData);

			// 2. Update driver document - clear assigned vehicle
			const driverRef = firestore.collection('vehicleDriver').doc(driverId);
			transaction.update(driverRef, updateDriverData);

			// 3. Create vehicle assignment record
			const assignmentRef = firestore.collection('vehicleAssignment').doc();
			transaction.set(assignmentRef, vehicleAssignmentData);

			// 4. Close the vehicle handover
			const handoverRef = firestore.collection('vehicleHandovers').doc(handoverId);
			transaction.update(handoverRef, updateHandoverData);

			return assignmentRef.id;
		});

		if (newStatus !== vehicle.status) {
			await addVehicleStatusChange({
				extraData: { handoverId, type },
				vehicleId: registrationNumber,
				status: newStatus,
				timestamp,
				userId: approver.id,
				userName: approver.name
			});
		}

		return { success: true, assignmentId };
	} catch (error) {
		console.error(`${logTag} failed:`, error);
		return {
			success: false,
			error: error instanceof Error ? error.message : 'Unknown transaction error'
		};
	}
}

/**
 * Atomically returns a vehicle from a driver and closes the voluntary return handover.
 * Deterministic status: status stays the same unless it was 'assigned' (becomes 'available').
 */
export async function returnVehicleAndCloseHandover(data: ReturnVehicleData): Promise<{ success: boolean; assignmentId?: string; error?: string }> {
	return closeReturnHandover(data, 'return');
}

/**
 * Atomically returns a vehicle from a driver and closes the unilateral return handover.
 * Deterministic status: status stays the same unless it was 'assigned' (becomes 'available').
 */
export async function unilateralReturnVehicleAndCloseHandover(data: UnilateralReturnVehicleData): Promise<{ success: boolean; assignmentId?: string; error?: string }> {
	return closeReturnHandover(data, 'unilateral');
}

/**
 * @deprecated Use returnVehicleAndCloseHandover
 */
export async function returnVehicle(registrationNumber: string, driverId: string, handoverId: string): Promise<{ success: boolean; assignmentId?: string; error?: string }> {
	return returnVehicleAndCloseHandover({ registrationNumber, driverId, handoverId, approver: { id: 'system', name: 'System' } });
}


type TransitionHandler = (vehicle: Vehicle.Vehicle, extraData: any) => Promise<boolean | void> | boolean | void;

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
			return true;
		},
		broken: () => true,
		under_maintenance: () => true,
		unmovable: () => true
	},
	available: {
		under_maintenance: () => true,
		broken: () => true,
		unmovable: () => true
	},
	assigned: {
		broken: () => true,
		unmovable: () => true
	},
	under_maintenance: {
		available: () => true,
		broken: () => true,
		unmovable: () => true
	},
	broken: {
		available: async (vehicle, extraData) => {
			if (!extraData.completed) throw error(400, 'Repair not marked as completed');
			return true;
		},
		under_maintenance: () => true,
		unmovable: () => true
	},
	unmovable: {
		available: () => true,
		under_maintenance: () => true,
		broken: () => true
	},
	retired: {
		precheck: () => true
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

	// Run custom transition checks if a handler exists
	try {
		const result = await transitionHandler(vehicle, extraData);
		if (result === false) {
			throw error(400, `Transition from ${currentStatus} to ${newStatus} is currently disabled or not fully implemented`);
		}
	} catch (err: any) {
		if (err?.status && err?.body?.message) throw err; // Re-throw SvelteKit errors
		throw error(400, `Failed to transition status: ${err.message || 'Unknown error'}`);
	}

	await updateVehicle(vehicle.id, { status: newStatus });
	await addVehicleStatusChange({ extraData, vehicleId: vehicle.id, status: newStatus, timestamp: Date.now(), userId: user.id, userName: user.name })
	return { success: true, status: newStatus };
};