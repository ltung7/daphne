import { getItemById, getItems, addItem } from "./firebase";

const collectionName: string = 'vehicleDriverStatusChange';

interface DriverStatusChange {
    status: Driver.Status;
    userId: string;
    userName: string;
    timestamp: number;
    extraData: any;
    driverId: string;
}

export const addVehicleDriverStatusChange = async (data: DriverStatusChange) => {
    return addItem(data, collectionName);
}

export const getVehicleDriverStatusChange = async <T=DriverStatusChange> (id: string): Promise<T|null> => {
    return getItemById(id, collectionName);
}

export const findVehicleDriverStatusChanges = async <T=DriverStatusChange> (query: App.FirebaseItemsQuery = false, select: App.FirebaseItemsFields = false): Promise<T[]> => {
    return getItems(collectionName, query, select);
}