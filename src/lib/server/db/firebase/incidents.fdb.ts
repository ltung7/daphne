import { setItem, getItemById, getItems, batchOperations, addItem } from "./firebase";

const collectionName: string = 'incidents';

export const addIncident = async (data: Omit<App.Incident.IncidentLog, 'id'>): Promise<string> => {
    // addItem returns the generated ID
    const id = await addItem(data, collectionName) as string;
    return id;
}

export const setIncident = async (id: string, data: Partial<App.Incident.IncidentLog>) => {
    return setItem(id, data, collectionName, true);
}

export const getIncident = async <T=App.Incident.IncidentLog> (id: string): Promise<T|null> => {
    return getItemById(id, collectionName);
}

export const findIncidents = async <T=App.Incident.IncidentLog> (query: App.FirebaseItemsQuery = false, select: App.FirebaseItemsFields = false): Promise<T[]> => {
    return getItems(collectionName, query, select);
}
