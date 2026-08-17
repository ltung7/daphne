import { setItem, getItemById, getItems } from "./firebase";

const mainCollectionName = 'logs';

const collectionRef = (key: string, collection: string) => [ mainCollectionName, key, collection ].join('/');

export const setFdbLog = async (key:string, collection:string, id: string, data: ExplicitAnyToExtend) => {
    return setItem(id, data, collectionRef(key, collection), true);
}

export const getFdbLog = async (key: string, collection: string, id: string) => {
    return getItemById(id, collectionRef(key, collection));
}

export const findFdbLog = async (key: string, collection: string, query: App.FirebaseItemsQuery = false, select: App.FirebaseItemsFields = false) => {
    return getItems(collectionRef(key, collection), query, select);
}

export const setUpdateConfigsLog = async (type: string, accountId: string, data: ExplicitAnyToExtend, user: string, timestamp: number = Date.now()) => {
    await setFdbLog(`upd-configs-${type}`, accountId, timestamp.toString(), {
        data,
        user,
        timestamp
    });
}