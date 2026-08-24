import { setItem, getItemById, getItems, queryItemIds } from "./firebase";

const collectionName: string = 'vehicleHandoverTranslation';

export const setVehicleHandoverTranslation = async (id: string, data: ExplicitAnyToExtend) => {
    return setItem(id, data, collectionName, true);
}

export const getVehicleHandoverTranslation = async <T=ExplicitAnyToExtend> (id: string): Promise<T|null> => {
    return getItemById(id, collectionName);
}

export const findVehicleHandoverTranslation = async <T=ExplicitAnyToExtend> (query: App.FirebaseItemsQuery = false, select: App.FirebaseItemsFields = false): Promise<T[]> => {
    return getItems(collectionName, query, select);
}

export const getVehicleHandoverTranslationLocales = async (queryParams: App.FirebaseQueryList = []) => {
    return queryItemIds(collectionName, queryParams)
}