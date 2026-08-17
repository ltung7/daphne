import { setItem, getItemById, getItems } from "./firebase";

const collectionName: string = '__name__';

export const set__objName__ = async (id: string, data: ExplicitAnyToExtend) => {
    return setItem(id, data, collectionName, true);
}

export const get__objName__ = async <T=ExplicitAnyToExtend> (id: string): Promise<T|null> => {
    return getItemById(id, collectionName);
}

export const find__objName__ = async <T=ExplicitAnyToExtend> (query: App.FirebaseItemsQuery = false, select: App.FirebaseItemsFields = false): Promise<T[]> => {
    return getItems(collectionName, query, select);
}