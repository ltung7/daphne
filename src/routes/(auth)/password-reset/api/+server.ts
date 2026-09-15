import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';
import { sendPasswordResetEmail } from '$lib/mails/mailTemplates.js';

export const POST: RequestHandler = async ({ request }) => {
	const body = await request.json();
	const email = body?.email;

	if (!email || typeof email !== 'string') {
		return json({ success: false, message: 'Podaj adres email' }, { status: 400 });
	}

	try {
		await sendPasswordResetEmail(email);
		return json({ success: true, message: 'Link do resetowania hasła został wysłany na Twój email' });
	} catch {
		return json({ success: false, message: 'Nie udało się wysłać linku resetującego' }, { status: 400 });
	}
};