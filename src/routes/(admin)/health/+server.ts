import { json } from '@sveltejs/kit';
import { checkFleetProblems } from '$lib/server/services/health/healthCheck.service';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async () => {
	try {
		const result = await checkFleetProblems({});
		return json({ success: true, result });
	} catch (error) {
		console.error('Failed to trigger health check:', error);
		return json({ success: false, error: 'Internal server error' }, { status: 500 });
	}
};
