import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getIncident, setIncident } from '$lib/server/db/firebase/incidents.fdb';

export const PATCH: RequestHandler = async ({ params, request, locals }) => {
	const id = params.id;
	if (!id) return json({ error: 'Missing ID' }, { status: 400 });

	const incident = await getIncident(id);
	if (!incident) return json({ error: 'Incident not found' }, { status: 404 });

	const data = await request.json();
	const updates: Partial<App.Incident.IncidentLog> = {};

	if (data.notes !== undefined) {
		updates.notes = data.notes;
	}

	if (data.status && data.status !== incident.status) {
		updates.status = data.status;
		
		if (data.status === 'resolved') {
			updates.resolvedAt = Date.now();
			if (locals._user) {
				updates.resolvedBy = locals._user.id;
				updates.resolvedByName = locals._user.name;
			}
		}
	}

	if (Object.keys(updates).length > 0) {
		await setIncident(id, updates);
	}

	return json({ success: true });
};
