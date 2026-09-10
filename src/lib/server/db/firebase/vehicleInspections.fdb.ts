import { setItem, getItemById, getItems, addItem } from "./firebase";

const collectionName: string = 'vehicleInspections';

export const setVehicleInspection = async (id: string, data: Omit<DocumentGenerator.InspectionDocumentRecord, 'id'>) => {
    return setItem(id, data, collectionName, true);
}

export const addVehicleInspection = async (data: Omit<DocumentGenerator.InspectionDocumentRecord, 'id'>) => {
    return addItem(data, collectionName);
}

export const getVehicleInspection = async <T=DocumentGenerator.InspectionDocumentRecord> (id: string): Promise<T|null> => {
    return getItemById(id, collectionName);
}

export const findVehicleInspections = async <T=DocumentGenerator.InspectionDocumentRecord> (query: App.FirebaseItemsQuery = false, select: App.FirebaseItemsFields = false): Promise<T[]> => {
    return getItems(collectionName, query, select);
}