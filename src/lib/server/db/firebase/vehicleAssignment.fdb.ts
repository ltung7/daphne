import { addItem } from "./firebase";

const collectionName: string = 'vehicleAssignment';

export const addVehicleAssignmentRecord = async (registrationNumber: string, driverId: string, handoverId: string, type: Vehicle.HandoverDocumentType) => {
    const timestamp = Date.now();
    const data: Vehicle.VehicleAssignmentData = { registrationNumber, driverId, timestamp, handoverId, type }
    return addItem(data, collectionName);
}