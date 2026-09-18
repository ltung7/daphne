import { getItemById, getItems, addItem, getLatestItems } from "./firebase";

const collectionName: string = 'vehicleDriverStatusChange';

export const addVehicleDriverStatusChange = async (data: Driver.DriverStatusChange) => {
    return addItem(data, collectionName);
}

export const getVehicleDriverStatusChange = async <T=Driver.DriverStatusChange> (id: string): Promise<T|null> => {
    return getItemById(id, collectionName);
}

export const findVehicleDriverStatusChanges = async <T=Driver.DriverStatusChange> (query: App.FirebaseItemsQuery = false, select: App.FirebaseItemsFields = false): Promise<T[]> => {
    return getItems(collectionName, query, select);
}

export const getLatestVehicleDriverStatusChanges = async <T=Driver.DriverStatusChange> (
    driverId: string,
    offset: number,
    limit: number = 10
): Promise<T[]> => {
    return getLatestItems(collectionName, limit, false, offset, { driverId }, 'timestamp');
}