import type { LayoutServerLoad } from './$types';

export const load = (async ({ locals }) => {
    const _user = locals._user;
    const exp = locals.sessionClaims?.exp;
    return { _user, exp };
}) satisfies LayoutServerLoad;