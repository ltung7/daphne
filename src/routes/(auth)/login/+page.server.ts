import { redirect, fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types.js';
import { verifyIdToken, sendPasswordResetEmail } from '$lib/server/auth/firebaseAdmin.js';
import { resolveUser } from '$lib/server/auth/userLookup.js';
import { setSessionAndPrefs, clearAllSessionCookies } from '$lib/server/auth/session.js';

export const load: PageServerLoad = async () => {
	return {};
};

export const actions: Actions = {
	signin: async ({ request, cookies }) => {
		const formData = await request.formData();
		const idToken = formData.get('idToken');

		if (!idToken || typeof idToken !== 'string') {
			return fail(400, { message: 'Brak tokenu ID' });
		}

		try {
			const decoded = await verifyIdToken(idToken);
			const { userType, userData, claims } = await resolveUser(decoded.uid);

			if (claims.role === 'revoked') {
				await clearAllSessionCookies(cookies);
				throw redirect(302, '/login?revoked=true');
			}

			await setSessionAndPrefs({ cookies, locals: {} as any }, userType, idToken, userData);

			const redirectUrl = userType === 'driver' ? '/driver' : '/';
			throw redirect(302, redirectUrl);
		} catch (err) {
			if (err instanceof Response) throw err;
			return fail(400, { message: 'Nieprawidłowy token lub konto nie skonfigurowane' });
		}
	},

	google: async ({ request, cookies }) => {
		const formData = await request.formData();
		const idToken = formData.get('idToken');

		if (!idToken || typeof idToken !== 'string') {
			return fail(400, { message: 'Brak tokenu ID' });
		}

		try {
			const decoded = await verifyIdToken(idToken);
			const { userType, userData, claims } = await resolveUser(decoded.uid);

			if (claims.role === 'revoked') {
				await clearAllSessionCookies(cookies);
				throw redirect(302, '/login?revoked=true');
			}

			await setSessionAndPrefs({ cookies, locals: {} as any }, userType, idToken, userData);

			const redirectUrl = userType === 'driver' ? '/driver' : '/';
			throw redirect(302, redirectUrl);
		} catch (err) {
			if (err instanceof Response) throw err;
			return fail(400, { message: 'Konto nie skonfigurowane w systemie' });
		}
	},

	forgotPassword: async ({ request }) => {
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