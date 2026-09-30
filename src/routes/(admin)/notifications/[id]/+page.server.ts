import { getNotification } from '$lib/server/db/firebase/userNotifications.fdb';
import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load = (async ({ params, locals }) => {
	const item = await getNotification(params.id);
	if (!item) throw error(404, 'Notification not found');
	
	// Ensure the user only sees their own notifications
	const uid = locals.sessionClaims?.uid;
	if (item.userId !== uid && locals.sessionClaims?.role === 'driver') {
		// Only admins or the owner can view
		throw error(403, 'Forbidden');
	}

	return { notification: item }
}) satisfies PageServerLoad;
