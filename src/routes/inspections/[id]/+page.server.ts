import { getVehicleInspection } from '$lib/server/db/firebase/vehicleInspections.fdb';
import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load = (async ({ params }) => {
    const inspection = await getVehicleInspection(params.id);
    if (!inspection) throw error(404, 'Nie znaleziono tej inspekcji');
    return { inspection }
}) satisfies PageServerLoad;