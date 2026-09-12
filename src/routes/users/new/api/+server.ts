import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { setUser } from "$lib/server/db/firebase/users.fdb";
import { error } from '@sveltejs/kit';
import { randomUUID } from 'crypto';

export const POST: RequestHandler = async ({ request }) => {
	const data = await request.json() as Partial<App.User>;
	
	if (!data.name || !data.email) {
		throw error(400, 'Brak wymaganych pól: name, email');
	}
	
	const id = randomUUID();
	const user: App.User = {
		id,
		name: data.name,
		email: data.email,
		role: data.role || 'moderator',
		preferredLanguage: data.preferredLanguage || 'pl',
		timestamp: Date.now(),
		updatedAt: Date.now(),
		canSignHandovers: data.canSignHandovers || false,
		lastLoggedIn: 0
	};
	
	await setUser(id, user);
	return json({ success: true, id });
};