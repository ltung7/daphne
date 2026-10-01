import { getVehicleHandovers } from '$lib/server/db/firebase/vehicleHandovers.fdb';
import { getVehicle } from '$lib/server/db/firebase/vehicles.fdb';
import { getDriver } from '$lib/server/db/firebase/drivers.fdb';
import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load = (async ({ params }) => {
	const handover = await getVehicleHandovers(params.id);
	if (!handover) throw error(404, 'No such handover document');

	const vehicle = handover.registrationNumber ? await getVehicle(handover.registrationNumber) : null;
	const driver = handover.driverId ? await getDriver(handover.driverId) : null;

	return { handover, vehicle, driver };
}) satisfies PageServerLoad;
