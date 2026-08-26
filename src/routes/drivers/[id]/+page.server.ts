import { getDriver } from '$lib/server/db/firebase/drivers.fdb';
import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { findDriverDocuments } from '$lib/server/db/firebase/driverDocuments.fdb';

export const load = (async ({ params }) => {
    const driver = await getDriver(params.id);
    if (!driver) throw error(404, 'Driver not found');
    const documents = await findDriverDocuments({ driverId: driver.id })
    return { driver, documents }
}) satisfies PageServerLoad;