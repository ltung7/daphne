import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types.js';
import { clearAllSessionCookies } from '$lib/server/auth/session.js';

export const load: PageServerLoad = async ({ cookies }) => {
	await clearAllSessionCookies(cookies);
	throw redirect(302, '/login?message=loggedOut');
};