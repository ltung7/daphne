import { setItem, getItemById, getItems } from "./firebase";

const collectionName: string = 'driverDocuments';

export const setDriverDocuments = async (id: string, data: Partial<Driver.DriverDocument>) => {
    return setItem(id, data, collectionName, true);
}

export const getDriverDocuments = async <T=Driver.DriverDocument> (id: string): Promise<T|null> => {
    return getItemById(id, collectionName);
}

export const findDriverDocuments = async <T=Driver.DriverDocument> (query: App.FirebaseItemsQuery<keyof Driver.DriverDocument> = false, select: App.FirebaseItemsFields = false): Promise<T[]> => {
    return getItems(collectionName, query, select);
}