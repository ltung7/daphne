import { setItem, getItemById, getItems, updateItem } from "./firebase";

const collectionName: string = 'healthMatrix';

export const setHealthMatrixRecipients = async (problemType: HealthCheck.HealthCheckProblem, recipients: App.BaseContact[]) => {
	try {
		return await updateItem(problemType, { recipients }, collectionName);
	} catch {
		return setItem(problemType, { recipients }, collectionName, true);
	}
}

export const getHealthMatrixRecipients = async (problemType: HealthCheck.HealthCheckProblem): Promise<App.BaseContact[] | null> => {
	const doc = await getItemById<{ recipients: App.BaseContact[] }>(problemType, collectionName);
	return doc?.recipients ?? null;
}

export const getHealthMatrix = async (): Promise<Partial<HealthCheck.HealthCheckRecipientMap>> => {
	const docs = await getItems<{ recipients: App.BaseContact[] } & { id: string }>(collectionName);
	const matrix: Partial<HealthCheck.HealthCheckRecipientMap> = {};
	for (const doc of docs) {
		matrix[doc.id as HealthCheck.HealthCheckProblem] = doc.recipients;
	}
	return matrix;
}