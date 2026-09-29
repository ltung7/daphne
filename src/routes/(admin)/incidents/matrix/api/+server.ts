import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getIncidentMatrix, setIncidentMatrixRecipients, getIncidentMatrixRecipients } from '$lib/server/db/firebase/incidentMatrix.fdb';

const defaultMatrix: Record<App.MatrixNotificationType, App.BaseContact[]> = {
	vehicle_document_expiring: [],
	vehicle_document_expired: [],
	driver_document_expiring: [],
	driver_document_expired: [],
	early_settlement_requested: [],
	early_settlement_approved: [],
	early_settlement_rejected: []
};

export const GET: RequestHandler = async () => {
	try {
		const matrix = await getIncidentMatrix();
		const result = { ...defaultMatrix } as Record<App.MatrixNotificationType, App.BaseContact[]>;
		for (const key in defaultMatrix) {
			const problem = key as App.MatrixNotificationType;
			result[problem] = matrix[problem] ?? defaultMatrix[problem] ?? [];
		}
		return json({ success: true, matrix: result });
	} catch (error) {
		console.error('Failed to load incident matrix:', error);
		return json({ success: false, error: 'Internal server error' }, { status: 500 });
	}
};

export const POST: RequestHandler = async ({ request }) => {
	try {
		const { problem, recipients }: { problem: App.MatrixNotificationType; recipients: App.BaseContact[] } = await request.json();
		await setIncidentMatrixRecipients(problem, recipients);
		const updated = await getIncidentMatrixRecipients(problem);
		return json({ success: true, recipients: updated ?? [] });
	} catch (error) {
		console.error('Failed to save incident matrix:', error);
		return json({ success: false, error: 'Internal server error' }, { status: 500 });
	}
};
