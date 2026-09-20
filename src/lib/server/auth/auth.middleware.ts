import { redirect, type Cookies, type Handle } from '@sveltejs/kit';
import { verifySessionCookie, clearAllSessionCookies } from '$lib/server/auth/session.js';
import { getUserById } from '$lib/server/auth/userLookup.js';
import { ADMIN_COOKIE, DRIVER_COOKIE, CHECK_AUTH } from '$lib/server/auth/types.js';
import { isDev } from '$lib/utils/isDev.js';

export const authMiddleware: Handle = async ({ event, resolve }) => {
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
		if (!claims && cookie) {
			await clearAllSessionCookies(event.cookies);
			if (CHECK_AUTH) throw redirect(302, '/login?message=expired');
		}
		userType = 'driver';
	} else if (isAdminRoute) {
		const cookie = event.cookies.get(ADMIN_COOKIE);
		if (cookie) claims = await verifySessionCookie(cookie, 'admin');
		if (!claims && cookie) {
			await clearAllSessionCookies(event.cookies);
			if (CHECK_AUTH) throw redirect(302, '/login?message=expired');
		}
		userType = 'admin';
	} else if (isGeneralRoute || !isAuthRoute) {
		const driverCookie = event.cookies.get(DRIVER_COOKIE);
		if (driverCookie) {
			claims = await verifySessionCookie(driverCookie, 'driver');
			if (!claims) {
				await clearAllSessionCookies(event.cookies);
				if (CHECK_AUTH) throw redirect(302, '/login?message=expired');
			}
			userType = 'driver';
		} else {
			const adminCookie = event.cookies.get(ADMIN_COOKIE);
			if (adminCookie) {
				claims = await verifySessionCookie(adminCookie, 'admin');
				if (!claims) {
					await clearAllSessionCookies(event.cookies);
					if (CHECK_AUTH) throw redirect(302, '/login?message=expired');
				}
				userType = 'admin';
			}
		}
	}

	let user: App.UserBase | null = null;
	if (claims) {
		user = await getUserById(claims.uid);
	}

	if (claims?.role === 'revoked' || user?.role === 'revoked') {
		if (user && user.role !== 'revoked' && claims) {
			// Token is stale (has role: revoked but DB says otherwise). Allow access.
			claims.role = user.role;
		} else {
			await clearAllSessionCookies(event.cookies);
			if (CHECK_AUTH) throw redirect(302, '/login?message=revoked');
		}
	}

	event.locals.sessionClaims = claims;
	event.locals._userType = claims ? userType : null;

	if (claims && user) {
		if (userType === 'driver') {
			event.locals._driver = user;
		} else {
			event.locals._user = {
				...user,
				canSignHandovers: true // default for admins
			} as unknown as App.User;
		}
	}

	return resolve(event);
};