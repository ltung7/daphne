import { getUser } from '$lib/server/db/firebase/users.fdb';
import { error, json } from '@sveltejs/kit';
import { updateUser } from "$lib/server/auth/firebaseAdmin";
import randomString from "$lib/utils/randomString";
import { sendPasswordResetEmail } from '$lib/mails/mailTemplates';

export async function sendUserPasswordResetEmail(userId: string) {
    const user = await getUser<App.User>(userId);
    if (!user) throw error(404, 'Nie znaleziono tego użytkownika');

    const resetLink = await sendPasswordResetEmail(user.email);
    return resetLink;
}

export const handlePasswordResetEndpoint = async (userId: string, action: 'send_reset_email' | 'reset_password') => {
    const user = await getUser<App.User>(userId);
    if (!user) throw error(404, 'Nie znaleziono tego użytkownika');

    if (action === 'send_reset_email') {
        const resetLink = await sendUserPasswordResetEmail(userId);
        return json({ success: true, resetLink });
    }

    if (action === 'reset_password') {
        const password = randomString(12, false);
        await updateUser(user.id, { password });
        return json({ success: true, password });
    }

    throw error(400, 'Invalid request');
}