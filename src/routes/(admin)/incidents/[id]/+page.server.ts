import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { getIncident } from '$lib/server/db/firebase/incidents.fdb';

export const load: PageServerLoad = async ({ params }) => {
	const incident = await getIncident(params.id);
	
	if (!incident) {
		error(404, 'Incident not found');
	}

	return {
		incident
	};
};
