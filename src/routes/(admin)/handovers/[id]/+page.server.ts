import { getVehicleHandovers } from '$lib/server/db/firebase/vehicleHandovers.fdb';
import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { isAdmin } from '$lib/server/auth/adminAuth';

export const load = (async ({ params, locals }) => {
    const handover = await getVehicleHandovers(params.id)
    if (!handover) throw error(404, 'No such document');
    
    return { 
        handover,
        admin: isAdmin(locals)
    }
}) satisfies PageServerLoad;