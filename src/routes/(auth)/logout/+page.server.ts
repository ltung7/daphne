import { redirect } from '@sveltejs/kit';
import type { Actions } from './$types.js';
import { clearAllSessionCookies } from '$lib/server/auth/session.js';

export const actions: Actions = {
	default: async ({ cookies }) => {
		await clearAllSessionCookies(cookies);
		// Note: The client side auth state will be cleared by a listener or redirect
		throw redirect(302, '/login?message=loggedOut');
	}
};