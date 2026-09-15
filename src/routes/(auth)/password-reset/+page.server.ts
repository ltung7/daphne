import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types.js';
import { sendPasswordResetEmail } from '$lib/server/auth/firebaseAdmin.js';

export const load: PageServerLoad = async () => {
	return {};
};

export const actions: Actions = {
	default: async ({ request }) => {
		const formData = await request.formData();
		const email = formData.get('email');

		if (!email || typeof email !== 'string') {
			return fail(400, { message: 'Podaj adres email' });
		}

		try {
			await sendPasswordResetEmail(email);
			return { success: true, message: 'Link do resetowania hasła został wysłany na Twój email' };
		} catch {
			return fail(400, { message: 'Nie udało się wysłać linku resetującego' });
		}
	}
};