import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { setUser } from "$lib/server/db/firebase/users.fdb";
import { error } from '@sveltejs/kit';
import { createUser } from "$lib/server/auth/firebaseAdmin";
import randomString from "$lib/utils/randomString";

export const POST: RequestHandler = async ({ request }) => {
	const data = await request.json() as { user: Partial<App.User> };
	
	if (!data.user.name || !data.user.email) {
		throw error(400, 'Brak wymaganych pól: name, email');
	}
	
	const password = randomString(12, false);
	
	const authUser = await createUser({
		email: data.user.email,
		password,
		displayName: data.user.name
	});

    const now = Date.now();
	const user: App.User = {
		id: authUser.uid,
		name: data.user.name,
		email: data.user.email,
		role: data.user.role || 'moderator',
		preferredLanguage: data.user.preferredLanguage || 'pl',
		timestamp: now,
		updatedAt: now,
		canSignHandovers: data.user.canSignHandovers || false,
		lastLoggedIn: 0
	};
	
	await setUser(authUser.uid, user);
	return json({ success: true, id: authUser.uid, password });
};