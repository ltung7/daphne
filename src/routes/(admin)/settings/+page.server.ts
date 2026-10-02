import { getSettingsGroup } from '$lib/server/db/firebase/settings.fdb';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
    const [ rideServices, company ] = await Promise.all([
        getSettingsGroup('rideServices'),
        getSettingsGroup('company')
    ]);

    const isAdmin = locals._user?.role === 'admin';

    return {
        settings: {
            rideServices: rideServices || {},
            company: company || {}
        },
        isAdmin
    };
};
