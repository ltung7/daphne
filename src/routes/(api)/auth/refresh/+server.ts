import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';
import { verifyIdToken } from '$lib/server/auth/firebaseAdmin.js';
import { resolveUser } from '$lib/server/auth/userLookup.js';
import { createSessionCookie, clearAllSessionCookies } from '$lib/server/auth/session.js';
import { ADMIN_COOKIE, DRIVER_COOKIE, SESSION_MAX_AGE } from '$lib/server/auth/types.js';
import { isDev } from '$lib/utils/isDev.js';

export const POST: RequestHandler = async ({ request, cookies }) => {
	try {
		const body = await request.json();
		const idToken = body.idToken;

		if (!idToken || typeof idToken !== 'string') {
			return json({ message: 'Missing ID token' }, { status: 400 });
		}

		const decoded = await verifyIdToken(idToken);
		const { userType, claims } = await resolveUser(decoded.uid);

		if (claims.role === 'revoked') {
			await clearAllSessionCookies(cookies);
			return json({ message: 'Account revoked' }, { status: 401 });
		}
		
		const sessionCookie = await createSessionCookie(idToken);
		const cookieName = userType === 'driver' ? DRIVER_COOKIE : ADMIN_COOKIE;
		
		// The client provided a fresh ID token. We issue a strict 2-hour Firebase session cookie.
		// However, to keep the "Remember Me" alive in the browser, we tell the browser 
		// to hold onto this new cookie for an extended duration if they had it.
		// Since we don't know the original rememberMe state here, we rely on the Client SDK's 
		// persistence. We can just set a generous maxAge here, and let the 2-hour JWT 
		// limit force the Client SDK to refresh it again later.
		cookies.set(cookieName, sessionCookie, {
			httpOnly: true,
			secure: !isDev,
			sameSite: 'lax',
			path: '/',
			maxAge: 60 * 60 * 24 * 7 // Keep browser cookie alive, but JWT dies in 2 hours
		});
		
		const exp = Math.floor(Date.now() / 1000) + SESSION_MAX_AGE;

		return json({ success: true, userType, exp });
	} catch (err) {
		console.error('Session refresh failed:', err);
		return json({ message: 'Refresh failed' }, { status: 401 });
	}
};