import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { checkFleetProblems, getFleedProblemsSummary } from '$lib/server/services/health/healthCheck.service';

export const GET: RequestHandler = async () => {
	try {
		const result = await getFleedProblemsSummary();
		return json({ success: true, ...result });
	} catch (error) {
		console.error('Failed to load health data:', error);
		return json({ success: false, error: 'Internal server error' }, { status: 500 });
	}
};

export const POST: RequestHandler = async () => {
	try {
		const result = await checkFleetProblems({});
		return json({ success: true, result });
	} catch (error) {
		console.error('Failed to trigger health check:', error);
		return json({ success: false, error: 'Internal server error' }, { status: 500 });
	}
};