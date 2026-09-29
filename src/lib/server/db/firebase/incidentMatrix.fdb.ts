import { setItem, getItemById, getItems, updateItem } from "./firebase";

const collectionName: string = 'incidentMatrix';

export const setIncidentMatrixRecipients = async (problemType: App.NotificationType, recipients: App.BaseContact[]) => {
	try {
		return await updateItem(problemType, { recipients }, collectionName);
	} catch {
		return setItem(problemType, { recipients }, collectionName, true);
	}
}

export const getIncidentMatrixRecipients = async (problemType: App.NotificationType): Promise<App.BaseContact[] | null> => {
	const doc = await getItemById<{ recipients: App.BaseContact[] }>(problemType, collectionName);
	return doc?.recipients ?? null;
}

export const getIncidentMatrix = async (): Promise<Partial<Record<App.MatrixNotificationType, App.BaseContact[]>>> => {
	const docs = await getItems<{ recipients: App.BaseContact[] } & { id: string }>(collectionName);
	const matrix: Partial<Record<App.MatrixNotificationType, App.BaseContact[]>> = {};
	for (const doc of docs) {
		matrix[doc.id as App.MatrixNotificationType] = doc.recipients;
	}
	return matrix;
}