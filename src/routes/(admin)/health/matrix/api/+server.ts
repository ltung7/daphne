import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getHealthMatrix, setHealthMatrixRecipients, getHealthMatrixRecipients } from '$lib/server/db/firebase/healthMatrix.fdb';

const defaultMatrix: HealthCheck.HealthCheckRecipientMap = {
	insurance_expiring: [],
	technical_expiring: [],
	license_expiring: [],
	taxi_authorization_expiring: []
};

export const GET: RequestHandler = async () => {
	try {
		const matrix = await getHealthMatrix();
		const result = { ...defaultMatrix } as HealthCheck.HealthCheckRecipientMap;
		for (const key in defaultMatrix) {
			const problem = key as HealthCheck.HealthCheckProblem;
			result[problem] = matrix[problem] ?? defaultMatrix[problem];
		}
		return json({ success: true, matrix: result });
	} catch (error) {
		console.error('Failed to load health matrix:', error);
		return json({ success: false, error: 'Internal server error' }, { status: 500 });
	}
};

export const POST: RequestHandler = async ({ request }) => {
	try {
		const { problem, recipients }: { problem: HealthCheck.HealthCheckProblem; recipients: App.BaseContact[] } = await request.json();
		await setHealthMatrixRecipients(problem, recipients);
		const updated = await getHealthMatrixRecipients(problem);
		return json({ success: true, recipients: updated ?? [] });
	} catch (error) {
		console.error('Failed to save health matrix:', error);
		return json({ success: false, error: 'Internal server error' }, { status: 500 });
	}
};
