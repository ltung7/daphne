import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { queryIncidentsPaginated } from '$lib/server/db/firebase/incidents.fdb';

export const GET: RequestHandler = async ({ url }) => {
	const now = Date.now();
	const fromParam = url.searchParams.get('from');
	const toParam = url.searchParams.get('to');
	
	const from = fromParam ? parseInt(fromParam, 10) : now - 7 * 24 * 60 * 60 * 1000;
	const to = toParam ? parseInt(toParam, 10) : now;

	const severity = url.searchParams.get('severity') as App.Incident.Severity | null;
	const status = url.searchParams.get('status') as App.Incident.Status | null;
	const category = url.searchParams.get('category') as App.Incident.Category | null;
	const source = url.searchParams.get('source') as App.Incident.Source | null;
	
	const cursorParam = url.searchParams.get('cursor');
	const cursor = cursorParam ? parseInt(cursorParam, 10) : null;
    
    // Adjust 'to' limit if cursor is provided
    const maxTimestamp = cursor ? cursor : to;

	const queries: App.FirebaseQueryList = [
		['timestamp', '>=', from],
		['timestamp', cursor ? '<' : '<=', maxTimestamp]
	];

	if (severity) queries.push(['severity', '==', severity]);
	if (status) queries.push(['status', '==', status]);
	if (category) queries.push(['category', '==', category]);
	if (source) queries.push(['source', '==', source]);

	const incidents = await queryIncidentsPaginated(queries, 50);

	return json({
		incidents,
		filters: {
			from,
			to,
			severity,
			status,
			category,
			source
		}
	});
};
