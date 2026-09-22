import { json } from '@sveltejs/kit';
import type { RequestEvent } from './$types';
import { updateDriver } from '$lib/server/db/firebase/drivers.fdb';
import { thrower } from '$lib/utils/logger';
import { sendPushEnabledNotification } from '$lib/server/notifications';

export const POST = async ({ request, locals }: RequestEvent) => {
    try {
        const { fcmToken } = await request.json();
        
        if (typeof fcmToken !== 'string') {
            return json({ success: false, error: 'Invalid fcmToken' }, { status: 400 });
        }

        const driverId = locals._driver?.id;
        
        if (!driverId) {
            return json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        await updateDriver(driverId, {
            fcmToken
        });

        // Try to send a confirmation notification
        const driver = locals._driver;
        if (driver && fcmToken) {
            // Include fcmToken in the object so it works immediately (in case the db read isn't fast enough downstream)
            await sendPushEnabledNotification({ ...driver, fcmToken });
        }

        return json({ success: true });
    } catch (err: unknown) {
        return thrower.endpointSoft(err, true);
    }
}

export const DELETE = async ({ locals }: RequestEvent) => {
    try {
        const driverId = locals._driver?.id;
        
        if (!driverId) {
            return json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        await updateDriver(driverId, {
            fcmToken: ''
        });

        return json({ success: true });
    } catch (err: unknown) {
        return thrower.endpointSoft(err, true);
    }
}
