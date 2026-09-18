import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';
import { verifyIdToken } from '$lib/server/auth/firebaseAdmin.js';
import { resolveUser } from '$lib/server/auth/userLookup.js';
import { setSessionAndPrefs, clearAllSessionCookies } from '$lib/server/auth/session.js';
import { logger } from '$lib/utils/logger.js';

async function handleSignIn(body: any, cookies: any) {
	const idToken = body.idToken;
	if (!idToken || typeof idToken !== 'string') {
		return json({ message: 'Brak tokenu ID' }, { status: 400 });
	}

	try {
		const decoded = await verifyIdToken(idToken);
		const { userType, userData, claims } = await resolveUser(decoded.uid);

		if (claims.role === 'revoked') {
			await clearAllSessionCookies(cookies);
			return json({ redirect: '/login?revoked=true' }, { status: 302 });
		}
		await setSessionAndPrefs({ cookies, locals: {} as any }, userType, idToken, userData);

		const redirectUrl = userType === 'driver' ? '/driver' : '/panel';
		return json({ redirect: redirectUrl }, { status: 302 });
	} catch (err) {
		logger.error(err)
		if (err instanceof Response) throw err;
		return json({ message: 'Nieprawidłowy token lub konto nie skonfigurowane' }, { status: 400 });
	}
}

export const POST: RequestHandler = async ({ request, cookies }) => {
	const body = await request.json();
	const action = body.action;

	if (action === 'signin') {
		return handleSignIn(body, cookies);
	}

	if (action === 'google') {
		return handleSignIn(body, cookies);
	}

	return json({ message: 'Nieznana akcja' }, { status: 400 });
};