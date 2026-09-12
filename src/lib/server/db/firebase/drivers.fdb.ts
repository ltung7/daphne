import { setItem, getItemById, getItems, countItems, updateItem } from "./firebase";

const collectionName: string = 'vehicleDriver';

export const setDriver = async (id: string, data: Partial<Driver.Driver>) => {
    return setItem(id, data, collectionName, true);
}

export const getDriver = async <T=Driver.Driver> (id: string): Promise<T|null> => {
    return getItemById(id, collectionName);
}

export const updateDriver = async (id: string, data: Partial<Driver.Driver>) => {
    return updateItem(id, data, collectionName);
}

export const findDrivers = async <T=Driver.Driver> (query: App.FirebaseItemsQuery<keyof Driver.Driver> = false, select: App.FirebaseItemsFields = false): Promise<T[]> => {
    return getItems(collectionName, query, select);
}

export const countDrivers = async (query: App.FirebaseItemsQuery<keyof Driver.Driver> = false): Promise<number> => {
    return countItems(collectionName, query);
}

