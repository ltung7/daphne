import { setItem, getItemById, getItems } from "./firebase";

const collectionName: string = 'user';

export const setUser = async (id: string, data: ExplicitAnyToExtend) => {
    return setItem(id, data, collectionName, true);
}

export const getUser = async <T=ExplicitAnyToExtend> (id: string): Promise<T|null> => {
    return getItemById(id, collectionName);
}

export const findUser = async <T=ExplicitAnyToExtend> (query: App.FirebaseItemsQuery = false, select: App.FirebaseItemsFields = false): Promise<T[]> => {
    return getItems(collectionName, query, select);
}