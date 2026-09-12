import { redirect } from '@sveltejs/kit';
import { restrictDriver } from '$lib/server/auth/driverAuth.js';

export const load = async ({ locals }: { locals: App.Locals }) => {
	restrictDriver(locals);
	return {};
};