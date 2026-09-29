import { setItem, getItemById, getItems, addItem, queryItems, countQueryItems } from "./firebase";

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

export const queryIncidents = async <T=App.Incident.IncidentLog> (queries: App.FirebaseQueryList, select: App.FirebaseItemsFields = false, order: App.FirebaseOrderQuery = false, limit: number | false = false): Promise<T[]> => {
    return queryItems(collectionName, queries, select, order, limit);
}

export const queryIncidentsPaginated = async <T=App.Incident.IncidentLog> (queries: App.FirebaseQueryList, limit: number = 50): Promise<T[]> => {
    return queryItems(collectionName, queries, false, [ 'timestamp', 'desc' ], limit);
}

export const countOpenIncidents = async (): Promise<number> => {
    return countQueryItems(collectionName, [ [ 'status', '==', 'open' ] ]);
}
