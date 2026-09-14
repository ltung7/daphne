import { findVehicleHandoverTranslation } from '$lib/server/db/firebase/vehicleHandoverTranslation.fdb';
import { keyBy } from '$lib/utils/keyBy';
import type { PageServerLoad } from './$types';

export const load = (async () => {
    const allTranslations = await findVehicleHandoverTranslation().then(list => keyBy(list, 'id'))
    const locales = Object.keys(allTranslations);
    return { locales, allTranslations };
}) satisfies PageServerLoad;