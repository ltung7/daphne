import type { LayoutServerLoad } from './$types';
import { countOpenIncidents } from '$lib/server/db/firebase/incidents.fdb';

export const load = (async ({ locals }) => {
    const _user = locals._user;
    const exp = locals.sessionClaims?.exp;
    const openIncidentsCount = await countOpenIncidents();
    
    return { _user, exp, openIncidentsCount };
}) satisfies LayoutServerLoad;