import { db } from '$lib/server/db/firebase/firebase';
import { getVehicle } from '../db/firebase/vehicles.fdb';
import admin from 'firebase-admin';
import { insertRandomLog } from '../db/tables/randomLogs.db';

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
		console.log("ASSIGNTRANSATION")
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
		console.log("DONE")
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