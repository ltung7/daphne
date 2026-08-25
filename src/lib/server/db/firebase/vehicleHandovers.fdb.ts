import { setItem, getItemById, getItems, addItem, deleteItem } from "./firebase";

const collectionName: string = 'vehicleHandovers';

export const setVehicleHandovers = async (id: string, data: Partial<DocumentGenerator.HandoverDocumentRecord>) => {
    return setItem(id, data, collectionName, true);
}

export const getVehicleHandovers = async <T=DocumentGenerator.HandoverDocumentRecord> (id: string): Promise<T|null> => {
    return getItemById(id, collectionName);
}

export const findVehicleHandovers = async <T=DocumentGenerator.HandoverDocumentRecord> (query: App.FirebaseItemsQuery<keyof DocumentGenerator.HandoverDocumentRecord> = false, select: App.FirebaseItemsFields = false): Promise<T[]> => {
    return getItems(collectionName, query, select);
}

export const createVehicleHandover = async (data: Omit<DocumentGenerator.HandoverDocumentRecord, 'id'>) => {
    return addItem(data, collectionName);
}

export const deleteVehicleHandover = async (id: string) => {
    return deleteItem(id, collectionName);
}