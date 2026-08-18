import { setItem, getItemById, getItems } from "./firebase";

const collectionName: string = 'vehicleDocuments';

export const setVehicleDocuments = async (id: string, data: Partial<Vehicle.VehicleDocument>) => {
    return setItem(id, data, collectionName, true);
}

export const getVehicleDocuments = async <T=Vehicle.VehicleDocument> (id: string): Promise<T|null> => {
    return getItemById(id, collectionName);
}

export const findVehicleDocuments = async <T=Vehicle.VehicleDocument> (query: App.FirebaseItemsQuery = false, select: App.FirebaseItemsFields = false): Promise<T[]> => {
    return getItems(collectionName, query, select);
}