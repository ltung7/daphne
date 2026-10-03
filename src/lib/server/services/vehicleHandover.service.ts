import { db } from '$lib/server/db/firebase/firebase';
import { getVehicle } from '../db/firebase/vehicles.fdb';
import admin from 'firebase-admin';
import { addVehicleStatusChange } from '../db/firebase/vehicleStatusChange.fdb';
import { sendHandoverDocumentClosedNotification } from '$lib/server/notifications';

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

		// Send handover closed notification to admins
		try {
			await sendHandoverDocumentClosedNotification(
				{ id: approver.id, name: approver.name, email: '', phone: '', preferredLanguage: 'pl', fcmToken: '' },
				{
					registrationNumber,
					documentType: 'assign',
					userId: approver.id,
					userName: approver.name,
					newStatus: 'assigned',
					handoverId
				},
				approver.id === 'system' ? 'system' : 'admin_manual'
			);
		} catch (notificationError) {
			console.error('Failed to send handover closed notification:', notificationError);
		}

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

		// Send handover closed notification to admins
		try {
			await sendHandoverDocumentClosedNotification(
				{ id: approver.id, name: approver.name, email: '', phone: '', preferredLanguage: 'pl', fcmToken: '' },
				{
					registrationNumber,
					documentType: type,
					userId: approver.id,
					userName: approver.name,
					newStatus: newStatus as Vehicle.Status,
					handoverId
				},
				approver.id === 'system' ? 'system' : 'admin_manual'
			);
		} catch (notificationError) {
			console.error('Failed to send handover closed notification:', notificationError);
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
