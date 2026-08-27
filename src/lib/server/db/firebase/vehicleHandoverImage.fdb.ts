import { setItem, getItemById, getItems } from "./firebase";

const collectionName: string = 'vehicleHandoverImage';

export const setVehicleHandoverImage = async (id: string, data: Partial<DocumentGenerator.HandoverImage>) => {
    return setItem(id, data, collectionName, true);
}

export const getVehicleHandoverImage = async <T=DocumentGenerator.HandoverImage> (id: string): Promise<T|null> => {
    return getItemById(id, collectionName);
}

export const findVehicleHandoverImage = async <T=DocumentGenerator.HandoverImage> (query: App.FirebaseItemsQuery = false, select: App.FirebaseItemsFields = false): Promise<T[]> => {
    return getItems(collectionName, query, select);
}