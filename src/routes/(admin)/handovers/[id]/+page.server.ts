import { getVehicleHandovers } from '$lib/server/db/firebase/vehicleHandovers.fdb';
import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load = (async ({ params }) => {
    const handover = await getVehicleHandovers(params.id)
    if (!handover) throw error(404, 'No such document');
    return { handover }
}) satisfies PageServerLoad;