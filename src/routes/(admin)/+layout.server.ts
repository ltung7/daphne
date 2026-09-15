import type { LayoutServerLoad } from './$types';

export const load = (async ({ locals }) => {
    const _user = locals._user;
    return { _user };
}) satisfies LayoutServerLoad;