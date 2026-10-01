import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types.js';

export const load: PageServerLoad = async ({ locals, url }) => {
	const message = url.searchParams.get('message');
	
	// If already authenticated and not explicitly logging out or showing a message, redirect to dashboard
	if (locals.sessionClaims && !message) {
		if (locals._userType === 'driver') {
			throw redirect(302, '/driver');
		}
		if (locals._userType === 'admin') {
			throw redirect(302, '/panel');
		}
	}

	return {};
};