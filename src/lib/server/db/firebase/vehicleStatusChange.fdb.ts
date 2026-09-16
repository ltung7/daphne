import { addItem, getItemById, getItems } from "./firebase";

const collectionName: string = 'vehicleStatusChange';

interface VehicleStatusChange {
    status: Vehicle.Status;
    userId: string;
    userName: string;
    timestamp: number;
    extraData: any;
    vehicleId: string;
}

export const addVehicleStatusChange = async (data: VehicleStatusChange) => {
    return addItem(data, collectionName);
}

export const getVehicleStatusChange = async <T=VehicleStatusChange> (id: string): Promise<T|null> => {
    return getItemById(id, collectionName);
}

export const findVehicleStatusChanges = async <T=VehicleStatusChange> (query: App.FirebaseItemsQuery = false, select: App.FirebaseItemsFields = false): Promise<T[]> => {
    return getItems(collectionName, query, select);
}