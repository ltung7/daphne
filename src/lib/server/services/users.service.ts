import { getUser } from '$lib/server/db/firebase/users.fdb';
import { error, json } from '@sveltejs/kit';
import { updateUser } from "$lib/server/auth/firebaseAdmin";
import randomString from "$lib/utils/randomString";
import { sendPasswordResetEmail } from '$lib/mails/mailTemplates';
import { getDriver } from '../db/firebase/drivers.fdb';

export async function sendUserPasswordResetEmail(userId: string, user?: App.User | null) {
    if (!user) {
        user = await getUser<App.User>(userId);
        if (!user) throw error(404, 'Nie znaleziono tego użytkownika');
    }

    const resetLink = await sendPasswordResetEmail(user.email, user.preferredLanguage ?? 'pl');
    return resetLink;
}

export const handlePasswordResetEndpoint = async (userId: string, action: 'send_reset_email' | 'reset_password') => {
    const user = await getUser<App.User>(userId);
    if (!user) throw error(404, 'Nie znaleziono tego użytkownika');

    if (action === 'send_reset_email') {
        const resetLink = await sendUserPasswordResetEmail(userId, user);
        return json({ success: true, resetLink });
    }

    if (action === 'reset_password') {
        const password = randomString(12, false);
        await updateUser(user.id, { password });
        return json({ success: true, password });
    }

    throw error(400, 'Invalid request');
}

export async function sendDriverPasswordResetEmail(driverId: string, driver?: Driver.Driver | null) {
    if (!driver) {
        driver = await getDriver(driverId);
        if (!driver) throw error(404, 'Nie znaleziono tego użytkownika');
    }

    const resetLink = await sendPasswordResetEmail(driver.email, driver.preferredLanguage ?? 'en');
    return resetLink;
}

export const handleDriverPasswordResetEndpoint = async (driverId: string, action: 'send_reset_email' | 'reset_password') => {
    const driver = await getDriver(driverId);
    if (!driver) throw error(404, 'Nie znaleziono tego użytkownika');

    if (action === 'send_reset_email') {
        const resetLink = await sendDriverPasswordResetEmail(driverId, driver);
        return json({ success: true, resetLink });
    }

    if (action === 'reset_password') {
        const password = randomString(12, false);
        await updateUser(driver.id, { password });
        return json({ success: true, password });
    }

    throw error(400, 'Invalid request');
}