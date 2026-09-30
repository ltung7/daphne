import { json } from '@sveltejs/kit';
import type { RequestEvent } from './$types';
import { getUserNotifications, markNotificationRead, markAllNotificationsRead } from '$lib/server/db/firebase/userNotifications.fdb';
import { thrower } from '$lib/utils/logger';

export const GET = async ({ locals }: RequestEvent) => {
    try {
        const uid = locals.sessionClaims?.uid;
        if (!uid) return json({ error: 'Unauthorized' }, { status: 401 });

        const notifications = await getUserNotifications(uid);
        return json({ success: true, notifications });
    } catch (err) {
        return thrower.endpointSoft(err);
    }
}

export const PATCH = async ({ request, locals }: RequestEvent) => {
    try {
        const uid = locals.sessionClaims?.uid;
        if (!uid) return json({ error: 'Unauthorized' }, { status: 401 });

        const { notificationId, action } = await request.json();

        if (action === 'markAllRead') {
            await markAllNotificationsRead(uid);
            return json({ success: true });
        }

        if (notificationId) {
            await markNotificationRead(notificationId);
            return json({ success: true });
        }

        return json({ error: 'Invalid request' }, { status: 400 });
    } catch (err) {
        return thrower.endpointSoft(err);
    }
}
