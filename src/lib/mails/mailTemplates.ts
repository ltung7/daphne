import { generatePasswordResetLink } from "$lib/server/auth/firebaseAdmin"
import ResetMail from "./ResetMail.svelte";
import { sendLocalizedRenderedEmail } from '$lib/server/notifications/localized/localizedMailer';

export const sendPasswordResetEmail = async (email: string, locale: App.Locale) => {
    const link = await generatePasswordResetLink(email);
    await sendLocalizedRenderedEmail('tomasz.le@finnergroup.com', ResetMail, { locale, link });
    return link;
}