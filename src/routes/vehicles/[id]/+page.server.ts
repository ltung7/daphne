import { getVehicle } from '$lib/server/db/firebase/vehicles.fdb';
import { getVehicleType } from '$lib/server/db/firebase/vehicleType.fdb';
import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load = (async ({ params }) => {
    const vehicle = await getVehicle(params.id);
    if (!vehicle) throw error(404, 'Nie znaleziono tego pojazdu');
    const type = await getVehicleType(vehicle?.typeId);
    return { vehicle, type }
}) satisfies PageServerLoad;