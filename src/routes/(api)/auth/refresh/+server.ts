import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';
import { verifyIdToken } from '$lib/server/auth/firebaseAdmin.js';
import { resolveUser } from '$lib/server/auth/userLookup.js';
import { createSessionCookie, clearAllSessionCookies } from '$lib/server/auth/session.js';
import { ADMIN_COOKIE, DRIVER_COOKIE, COOKIE_OPTIONS, SESSION_REMEMBER_MAX_AGE, SESSION_DEFAULT_MAX_AGE } from '$lib/server/auth/types.js';

export const POST: RequestHandler = async ({ request, cookies }) => {
	try {
		const body = await request.json();
		const idToken = body.idToken;
		const rememberMe = body.rememberMe ?? true;

		if (!idToken || typeof idToken !== 'string') {
			return json({ message: 'Missing ID token' }, { status: 400 });
		}

		const decoded = await verifyIdToken(idToken);
		const { userType, claims } = await resolveUser(decoded.uid);

		if (claims.role === 'revoked') {
			await clearAllSessionCookies(cookies);
			return json({ message: 'Account revoked' }, { status: 401 });
		}
		
		const maxAge = rememberMe ? SESSION_REMEMBER_MAX_AGE : SESSION_DEFAULT_MAX_AGE;
		const sessionCookie = await createSessionCookie(idToken, maxAge);
		const cookieName = userType === 'driver' ? DRIVER_COOKIE : ADMIN_COOKIE;
		
		cookies.set(cookieName, sessionCookie, {
			...COOKIE_OPTIONS,
			maxAge
		});
		
		const exp = Math.floor(Date.now() / 1000) + maxAge;

		return json({ success: true, userType, exp });
	} catch (err) {
		console.error('Session refresh failed:', err);
		return json({ message: 'Refresh failed' }, { status: 401 });
	}
};