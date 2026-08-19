import { getVehicle } from '$lib/server/db/firebase/vehicles.fdb';
import { getVehicleType } from '$lib/server/db/firebase/vehicleType.fdb';
import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { findVehicleDocuments } from '$lib/server/db/firebase/vehicleDocuments.fdb';

export const load = (async ({ params }) => {
    const vehicle = await getVehicle(params.id);
    if (!vehicle) throw error(404, 'Nie znaleziono tego pojazdu');
    const type = await getVehicleType(vehicle?.typeId);
    const documents = await findVehicleDocuments({ registrationNumber: vehicle.id })
    return { vehicle, type, documents }
}) satisfies PageServerLoad;