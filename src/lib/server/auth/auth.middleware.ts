import { redirect, type Handle } from '@sveltejs/kit';
import { verifySessionCookie, clearSessionCookie, clearAllSessionCookies } from '$lib/server/auth/session.js';
import { getUserById } from '$lib/server/auth/userLookup.js';
import { ADMIN_COOKIE, DRIVER_COOKIE, CHECK_AUTH } from '$lib/server/auth/types.js';
import { authCache } from '$lib/server/auth/authCache.js';

export const authMiddleware: Handle = async ({ event, resolve }) => {
	const routeId = event.route.id ?? '';
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
		if (cookie) claims = (await verifySessionCookie(cookie, 'driver')) || claims;
		if (!claims) {
			if (cookie) await clearAllSessionCookies(event.cookies);
			if (CHECK_AUTH) throw redirect(302, cookie ? '/login?message=expired' : '/login');
		}
		userType = 'driver';
	} else if (isAdminRoute) {
		const cookie = event.cookies.get(ADMIN_COOKIE);
		if (cookie) claims = await verifySessionCookie(cookie, 'admin');
		if (!claims) {
			if (cookie) await clearAllSessionCookies(event.cookies);
			if (CHECK_AUTH) throw redirect(302, cookie ? '/login?message=expired' : '/login');
		}
		userType = 'admin';
	} else {
		// All other routes: root '/', (general), (auth) routes like /login, /password-reset
		const driverCookie = event.cookies.get(DRIVER_COOKIE);
		if (driverCookie) {
			claims = await verifySessionCookie(driverCookie, 'driver');
			if (claims) {
				userType = 'driver';
			} else {
				await clearSessionCookie(event.cookies, 'driver');
			}
		}

		if (!claims) {
			const adminCookie = event.cookies.get(ADMIN_COOKIE);
			if (adminCookie) {
				claims = await verifySessionCookie(adminCookie, 'admin');
				if (claims) {
					userType = 'admin';
				} else {
					await clearSessionCookie(event.cookies, 'admin');
				}
			}
		}

		if (isGeneralRoute && !claims) {
			if (CHECK_AUTH) throw redirect(302, '/login');
		}
	}

	// Non-blocking initialization of banned UIDs cache on startup
	authCache.ensureInitialized().catch(() => {});

	// Fast in-memory ban check (0ms)
	if (claims && authCache.isBanned(claims.uid)) {
		await clearAllSessionCookies(event.cookies);
		if (CHECK_AUTH) throw redirect(302, '/login?message=revoked');
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
				canSignHandovers: true, // default for admins
				canAproveSettlements: true // default for admins
			} as unknown as App.User;
		}
	}

	return resolve(event);
};