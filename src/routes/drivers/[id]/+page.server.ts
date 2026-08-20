import { getDriver } from '$lib/server/db/firebase/drivers.fdb';
import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load = (async ({ params }) => {
    const driver = await getDriver(params.id);
    if (!driver) throw error(404, 'Driver not found');
    return { driver }
}) satisfies PageServerLoad;