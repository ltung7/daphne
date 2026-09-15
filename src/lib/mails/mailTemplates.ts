import { generatePasswordResetLink } from "$lib/server/auth/firebaseAdmin"
import { sendRenderedEmail } from '$lib/mails/mailer'
import ResetMail from "./ResetMail.svelte";

export const sendPasswordResetEmail = async (email: string) => {
    const link = await generatePasswordResetLink(email);
    await sendRenderedEmail('tomasz.le@finnergroup.com', ResetMail, { link });
    return link;
}