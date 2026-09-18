import { addItem, getItemById, getItems, getLatestItems } from "./firebase";

const collectionName: string = 'vehicleStatusChange';

export const addVehicleStatusChange = async (data: Vehicle.VehicleStatusChange) => {
    return addItem(data, collectionName);
}

export const getVehicleStatusChange = async <T=Vehicle.VehicleStatusChange> (id: string): Promise<T|null> => {
    return getItemById(id, collectionName);
}

export const findVehicleStatusChanges = async <T=Vehicle.VehicleStatusChange> (query: App.FirebaseItemsQuery = false, select: App.FirebaseItemsFields = false): Promise<T[]> => {
    return getItems(collectionName, query, select);
}

export const getLatestVehicleStatusChanges = async <T=Vehicle.VehicleStatusChange> (
    registrationNumber: string,
    offset: number,
    limit: number = 10
): Promise<T[]> => {
    return getLatestItems(collectionName, limit, false, offset, { vehicleId: registrationNumber }, 'timestamp');
}