import { getUser } from '$lib/server/db/firebase/users.fdb';
import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load = (async ({ params }) => {
	const user = await getUser<App.User>(params.id);
	if (!user) throw error(404, 'Nie znaleziono tego użytkownika');
	return { user }
}) satisfies PageServerLoad;