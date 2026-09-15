import { redirect, type Cookies, type Handle } from '@sveltejs/kit';
import { verifySessionCookie, clearAllSessionCookies } from '$lib/server/auth/session.js';
import { getUserById } from '$lib/server/auth/userLookup.js';
import { ADMIN_COOKIE, DRIVER_COOKIE, CHECK_AUTH } from '$lib/server/auth/types.js';

export const authMiddleware: Handle = async ({ event, resolve }) => {
	// Skip all auth checks if CHECK_AUTH is false (testing mode)
	if (!CHECK_AUTH) {
		return resolve(event);
	}

	const routeId = event.route.id ?? '';
	const isAuthRoute = routeId.startsWith('/(auth)');
	const isDriverRoute = routeId.startsWith('/(driver)');
	const isAdminRoute = routeId.startsWith('/(admin)');
	const isGeneralRoute = routeId.startsWith('/(general)');
	const isApiRoute = routeId.startsWith('/(api)');
	const isWebhookRoute = routeId.startsWith('/(webhooks)');

	if (isWebhookRoute || isApiRoute) {
		return resolve(event);
	}

	let claims: App.SessionClaims | null = event.locals?.sessionClaims ?? null;
	let userType: 'driver' | 'admin' | null = event.locals?._userType ?? null;

	if (isDriverRoute) {
		const cookie = event.cookies.get(DRIVER_COOKIE);
		if (cookie) claims = await verifySessionCookie(cookie, 'driver') || claims;
		userType = 'driver';
	} else if (isAdminRoute) {
		const cookie = event.cookies.get(ADMIN_COOKIE);
		if (cookie) claims = await verifySessionCookie(cookie, 'admin');
		userType = 'admin';
	} else if (isGeneralRoute || !isAuthRoute) {
		const driverCookie = event.cookies.get(DRIVER_COOKIE);
		if (driverCookie) {
			claims = await verifySessionCookie(driverCookie, 'driver');
			userType = 'driver';
		} else {
			const adminCookie = event.cookies.get(ADMIN_COOKIE);
			if (adminCookie) {
				claims = await verifySessionCookie(adminCookie, 'admin');
				userType = 'admin';
			}
		}
	}

	if (claims?.role === 'revoked') {
		await clearAllSessionCookies(event.cookies);
		throw redirect(302, '/login?revoked=true');
	}

	event.locals.sessionClaims = claims;
	event.locals._userType = claims ? userType : null;

	if (claims) {
		const user = await getUserById(claims.uid);
		if (user) {
			if (userType === 'driver') {
				event.locals._driver = user;
			} else {
				event.locals._user = {
					...user,
					canSignHandovers: true // default for admins
				} as unknown as App.User;
			}
		}
	}

	if (claims && (claims.exp - Date.now() / 1000) < 1800) {
		await refreshSessionCookie(event);
	}

	return resolve(event);
};

async function refreshSessionCookie(event: { cookies: Cookies; locals: App.Locals }) {
	const { cookies, locals } = event;
	
	if (!locals.sessionClaims) return;
	
	const userType = locals._userType;
	const cookieName = userType === 'driver' ? DRIVER_COOKIE : ADMIN_COOKIE;
	const currentCookie = cookies.get(cookieName);
	
	if (!currentCookie) return;
	
	try {
		const { createSessionCookie } = await import('$lib/server/auth/session.js');
		const newCookie = await createSessionCookie(currentCookie, userType!);
		cookies.set(cookieName, newCookie, { 
			httpOnly: true, 
			secure: process.env.NODE_ENV === 'production', 
			sameSite: 'lax', 
			path: '/', 
			maxAge: 60 * 60 * 2 
		});
	} catch {
		// Refresh failed, will be handled on next request
	}
}