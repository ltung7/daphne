import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types.js';

export const load: PageServerLoad = async ({ locals }) => {
	const userType = locals._userType;
	const sessionClaims = locals.sessionClaims;

	if (!userType || !sessionClaims) {
		throw redirect(302, '/login');
	}

	if (userType === 'driver') {
		throw redirect(302, '/driver');
	}

	if (userType === 'admin') {
		throw redirect(302, '/panel');
	}

	throw redirect(302, '/login');
};