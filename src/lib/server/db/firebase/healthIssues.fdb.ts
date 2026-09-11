import { setItem, getItemById, getItems, batchOperations } from "./firebase";

const collectionName: string = 'healthIssues';

export const setHealthIssue = async (id: string, data: HealthCheck.HealthIssue) => {
    return setItem(id, data, collectionName, true);
}

export const getHealthIssue = async <T=HealthCheck.HealthIssue> (id: string): Promise<T|null> => {
    return getItemById(id, collectionName);
}

export const findHealthIssues = async <T=HealthCheck.HealthIssue> (query: App.FirebaseItemsQuery = false, select: App.FirebaseItemsFields = false): Promise<T[]> => {
    return getItems(collectionName, query, select);
}

export const saveHealthIssues = async (list: Array<Partial<HealthCheck.HealthIssue>>) => {
    return batchOperations(collectionName, list, 'set');
}