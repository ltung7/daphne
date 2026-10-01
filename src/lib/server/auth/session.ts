import type { Cookies } from '@sveltejs/kit';
import { verifySessionCookie as firebaseVerifySessionCookie } from './firebaseAdmin.js';
import {
	ADMIN_COOKIE,
	DRIVER_COOKIE,
	PREFS_COOKIE,
	PARAGLIDE_LOCALE_COOKIE,
	COOKIE_OPTIONS,
	PREFS_COOKIE_OPTIONS,
	PARAGLIDE_COOKIE_OPTIONS,
	SESSION_REMEMBER_MAX_AGE,
	SESSION_DEFAULT_MAX_AGE
} from './types.js';

export async function createSessionCookie(idToken: string, maxAgeSeconds: number = SESSION_DEFAULT_MAX_AGE): Promise<string> {
	const { createSessionCookie: firebaseCreateSessionCookie } = await import('./firebaseAdmin.js');
	return firebaseCreateSessionCookie(idToken, maxAgeSeconds * 1000);
}

export async function verifySessionCookie(cookieValue: string, userType: 'admin' | 'driver'): Promise<App.SessionClaims | null> {
	try {
		const decoded = await firebaseVerifySessionCookie(cookieValue);
		return {
			uid: decoded.uid,
			email: decoded.email || '',
			role: (decoded as any).role || (userType === 'driver' ? 'driver' : 'admin'),
			driverId: (decoded as any).driverId,
			emailVerified: decoded.email_verified || false,
			iat: decoded.iat || Math.floor(Date.now() / 1000),
			exp: decoded.exp || Math.floor(Date.now() / 1000) + SESSION_DEFAULT_MAX_AGE
		};
	} catch {
		return null;
	}
}

export async function refreshSessionCookie(_event: { cookies: Cookies; locals: App.Locals }): Promise<void> {
	// Deprecated: Server cannot refresh Firebase session cookies directly without an ID token.
	// Session refresh is handled via POST /api/auth/refresh using client SDK ID tokens.
}

export async function clearSessionCookie(cookies: Cookies, userType: 'admin' | 'driver'): Promise<void> {
	const cookieName = userType === 'driver' ? DRIVER_COOKIE : ADMIN_COOKIE;
	cookies.delete(cookieName, { path: '/' });
}

export async function clearAllSessionCookies(cookies: Cookies): Promise<void> {
	cookies.delete(ADMIN_COOKIE, { path: '/' });
	cookies.delete(DRIVER_COOKIE, { path: '/' });
}

export async function setPrefsCookie(
	cookies: Cookies,
	prefs: { locale: App.Locale; mode: 'light' | 'dark' }
): Promise<void> {
	cookies.set(PREFS_COOKIE, JSON.stringify(prefs), PREFS_COOKIE_OPTIONS);
}

export function getPrefsCookie(cookies: Cookies): { locale: App.Locale; mode: 'light' | 'dark' } | null {
	const cookie = cookies.get(PREFS_COOKIE);
	if (!cookie) return null;
	
	try {
		return JSON.parse(cookie);
	} catch {
		return null;
	}
}

export async function setSessionAndPrefs(
	event: { cookies: Cookies; locals: App.Locals },
	userType: 'admin' | 'driver',
	idToken: string,
	userData: App.UserBase,
	rememberMe: boolean = false
): Promise<void> {
	const maxAge = rememberMe ? SESSION_REMEMBER_MAX_AGE : SESSION_DEFAULT_MAX_AGE;
	const sessionCookie = await createSessionCookie(idToken, maxAge);
	const cookieName = userType === 'driver' ? DRIVER_COOKIE : ADMIN_COOKIE;
	
	const options = { ...COOKIE_OPTIONS, maxAge };
	event.cookies.set(cookieName, sessionCookie, options);
	
	const prefs = {
		locale: userData.preferredLanguage,
		mode: 'light' as const
	};
	await setPrefsCookie(event.cookies, prefs);

	// Set PARAGLIDE_LOCALE cookie for paraglide middleware
	event.cookies.set(PARAGLIDE_LOCALE_COOKIE, userData.preferredLanguage, PARAGLIDE_COOKIE_OPTIONS);
	
	if (userType === 'driver') {
		event.locals._driver = userData;
		event.locals._user = null;
	} else {
		event.locals._user = {
			...userData,
			canSignHandovers: true, // default for admins
			canAproveSettlements: true // default for admins
		} as unknown as App.User;
		event.locals._driver = null;
	}
	
	event.locals._userType = userType;
	event.locals.sessionClaims = {
		uid: userData.id,
		email: userData.email,
		role: userData.role,
		emailVerified: true,
		iat: Math.floor(Date.now() / 1000),
		exp: Math.floor(Date.now() / 1000) + maxAge
	};
}