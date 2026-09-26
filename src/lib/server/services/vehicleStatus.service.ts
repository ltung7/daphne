import { db } from '$lib/server/db/firebase/firebase';
import { getVehicle, updateVehicle } from '../db/firebase/vehicles.fdb';
import admin from 'firebase-admin';
import { insertRandomLog } from '../db/tables/randomLogs.db';
import { error } from "@sveltejs/kit";
import { addVehicleStatusChange } from '../db/firebase/vehicleStatusChange.fdb';

export interface AssignVehicleData {
	registrationNumber: string; // registration number
	driverId: string;
	driverName: string;
	handoverId: string;
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
	const { registrationNumber, driverId, driverName, handoverId, uploadedDocumentUrl } = data;
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
		status: 'assigned'
	}
	const updateDriverData: Partial<Driver.Driver> = {
		assignedVehicle: {
			model,
			registrationNumber,
			timestamp
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
		return { success: true };
	} catch (error) {
		console.error('Transaction failed:', error);
		return {
			success: false,
			error: error instanceof Error ? error.message : 'Unknown transaction error'
		};
	}
}

/**
 * Releases a vehicle from a driver (reverse of assignVehicleAndCloseHandover)
 * Clears assignment fields and creates an unassignment record
 */
export async function releaseVehicle(vehicleId: string, driverId: string): Promise<{ success: boolean; error?: string }> {
	const firestore = db();
	const timestamp = Date.now();

	try {
		await firestore.runTransaction(async (transaction) => {
			// 1. Clear vehicle assignment
			const vehicleRef = firestore.collection('vehicles').doc(vehicleId);
			transaction.update(vehicleRef, {
				assignedDriverId: null,
				assignedDriverName: null,
				updatedAt: timestamp
			});

			// 2. Clear driver assignment
			const driverRef = firestore.collection('vehicleDriver').doc(driverId);
			transaction.update(driverRef, {
				assignedVehicle: null,
				updatedAt: timestamp
			});

			// 3. Create unassignment record (optional - could use same collection with status field)
			const assignmentRef = firestore.collection('vehicleAssignment').doc();
			transaction.set(assignmentRef, {
				registrationNumber: vehicleId,
				driverId,
				timestamp,
				type: 'unassignment'
			});
		});

		return { success: true };
	} catch (error) {
		console.error('Release transaction failed:', error);
		return {
			success: false,
			error: error instanceof Error ? error.message : 'Unknown transaction error'
		};
	}
}

/**
 * Atomically returns a vehicle from a driver (reverse of assignVehicleAndCloseHandover).
 * Updates:
 * 1. Vehicle document - removes assignedDriverId, assignedDriverName (uses FieldValue.delete())
 * 2. Driver document - sets assignedVehicle to false
 * 3. Creates vehicleAssignment record with type 'return'
 * 4. Updates vehicleHandovers with returnedAt timestamp
 */
export async function returnVehicle(registrationNumber: string, driverId: string, handoverId: string): Promise<{ success: boolean; assignmentId?: string; error?: string }> {
	const firestore = db();
	const timestamp = Date.now();

	try {
		await firestore.runTransaction(async (transaction) => {
			// 1. Update vehicle document - remove driver assignment fields
			const vehicleRef = firestore.collection('vehicles').doc(registrationNumber);
			transaction.update(vehicleRef, {
				assignedDriverId: admin.firestore.FieldValue.delete(),
				assignedDriverName: admin.firestore.FieldValue.delete(),
				updatedAt: timestamp
			});

			// 2. Update driver document - clear assigned vehicle (set to false)
			const driverRef = firestore.collection('vehicleDriver').doc(driverId);
			transaction.update(driverRef, {
				assignedVehicle: false,
				updatedAt: timestamp
			});

			// 3. Create vehicle assignment record with type 'return'
			const assignmentRef = firestore.collection('vehicleAssignment').doc();
			transaction.set(assignmentRef, {
				registrationNumber,
				driverId,
				handoverId,
				timestamp,
				type: 'return'
			});

			// 4. Update vehicle handover with return timestamp
			const handoverRef = firestore.collection('vehicleHandovers').doc(handoverId);
			transaction.update(handoverRef, {
				returnedAt: timestamp,
				updatedAt: timestamp
			});

			return assignmentRef.id;
		});

		return { success: true };
	} catch (error) {
		console.error('Return transaction failed:', error);
		return {
			success: false,
			error: error instanceof Error ? error.message : 'Unknown transaction error'
		};
	}
}


type TransitionHandler = (vehicle: Vehicle.Vehicle, extraData: any) => Promise<boolean | void> | boolean | void;

const statusTransitions: Partial<Record<Vehicle.Status, Partial<Record<Vehicle.Status, TransitionHandler>>>> = {
	precheck: {
		available: async (vehicle, extraData) => {
			if (!extraData.verificationResult) throw error(400, 'Missing verification data');
			const verified = extraData.verificationResult === true;
			if (!verified) throw error(400, 'Verification failed');
			return true;
		},
		broken: () => true,
		under_maintenance: () => true,
		unmovable: () => true
	},
	available: {
		under_maintenance: () => true,
		broken: () => true,
		unmovable: () => true,
		retired: () => true
	},
	assigned: {
		broken: () => true,
		unmovable: () => true,
		retired: () => true
	},
	under_maintenance: {
		available: () => true,
		broken: () => true,
		unmovable: () => true,
		retired: () => true
	},
	broken: {
		available: async (vehicle, extraData) => {
			if (!extraData.completed) throw error(400, 'Repair not marked as completed');
			return true;
		},
		under_maintenance: () => true,
		unmovable: () => true,
		retired: () => true
	},
	unmovable: {
		available: () => true,
		under_maintenance: () => true,
		broken: () => true,
		retired: () => true
	},
	retired: {
		precheck: () => true
	}
};

export const handleChangeVehicleStatus = async (vehicleOrId: string | Vehicle.Vehicle, newStatus: Vehicle.Status, extraData: any, user: App.User) => {
	const vehicle = typeof vehicleOrId === 'string' ? await getVehicle(vehicleOrId) : vehicleOrId;
	if (!vehicle) throw error(404, 'Vehicle not found');

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