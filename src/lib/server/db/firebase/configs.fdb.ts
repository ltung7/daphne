import { setItem, getItemById, getItems } from "./firebase";

const collectionName: string = 'configs';

export const setConfigs = async (id: string, data: ExplicitAnyToExtend) => {
    return setItem(id, data, collectionName, true);
}

export const getConfigs = async <T=ExplicitAnyToExtend> (id: string): Promise<T|null> => {
    return getItemById(id, collectionName);
}

export const findConfigs = async <T=ExplicitAnyToExtend> (query: App.FirebaseItemsQuery = false, select: App.FirebaseItemsFields = false): Promise<T[]> => {
    return getItems(collectionName, query, select);
}