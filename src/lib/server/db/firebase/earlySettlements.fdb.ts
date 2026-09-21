import { setItem, getItemById, getItems, addItem } from "./firebase";

const collectionName: string = 'earlySettlements';

export const setEarlySettlement = async (id: string, data: Partial<DriverBalance.EarlySettlement>) => {
    return setItem(id, data, collectionName, true);
}

export const addEarlySettlement = async (data: Omit<DriverBalance.EarlySettlement, 'id'>) => {
    return addItem(data, collectionName);
}

export const getEarlySettlement = async <T = DriverBalance.EarlySettlement>(id: string): Promise<T | null> => {
    return getItemById(id, collectionName);
}

export const findEarlySettlements = async <T = DriverBalance.EarlySettlement>(query: App.FirebaseItemsQuery = false, select: App.FirebaseItemsFields = false): Promise<T[]> => {
    return getItems(collectionName, query, select);
}