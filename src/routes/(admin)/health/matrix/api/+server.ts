import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import loadJson from '$lib/utils/loadJson';
import saveJson from '$lib/utils/saveJson';

const MATRIX_FILE = 'health_matrix';

const defaultMatrix: HealthCheck.HealthCheckRecipientMap = {
	insurance_expiring: [],
	technical_expiring: [],
	license_expiring: [],
	taxi_authorization_expiring: []
};

export const GET: RequestHandler = async () => {
	try {
		const matrix = await loadJson(MATRIX_FILE);
		return json({ success: true, matrix });
	} catch (error: any) {
		if (error.code === 'ENOENT') {
			// File doesn't exist yet, return default matrix
			return json({ success: true, matrix: defaultMatrix });
		}
		console.error('Failed to load health matrix:', error);
		return json({ success: false, error: 'Internal server error' }, { status: 500 });
	}
};

export const POST: RequestHandler = async ({ request }) => {
	try {
		const matrix: HealthCheck.HealthCheckRecipientMap = await request.json();
		await saveJson(matrix as any, MATRIX_FILE);
		return json({ success: true, matrix });
	} catch (error) {
		console.error('Failed to save health matrix:', error);
		return json({ success: false, error: 'Internal server error' }, { status: 500 });
	}
};
