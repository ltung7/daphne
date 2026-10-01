export type UserType = 'driver' | 'admin';
export type AdminRole = 'moderator' | 'manager' | 'admin';

export interface SessionClaims {
	uid: string;
	email: string;
	role: AdminRole | 'driver' | 'revoked';
	driverId?: string;
	emailVerified: boolean;
	iat: number;
	exp: number;
}

export interface UserBase {
	id: string;
	email: string;
	name: string;
	role: AdminRole | 'driver' | 'revoked';
	preferredLanguage: App.Locale;
	timestamp: number;
	updatedAt: number;
	lastLoggedIn: number;
}

export interface User extends UserBase {
	role: AdminRole | 'revoked';
	canSignHandovers: boolean;
}

export interface AuthResult {
	userType: UserType;
	userData: UserBase;
	claims: SessionClaims;
}

export const ADMIN_COOKIE = 'app.admin.session';
export const DRIVER_COOKIE = 'app.driver.session';
export const PREFS_COOKIE = 'app.prefs';
export const PARAGLIDE_LOCALE_COOKIE = 'PARAGLIDE_LOCALE';

// Session durations (in seconds)
// Firebase Admin SDK createSessionCookie allows minimum 5 minutes, maximum 14 days (1,209,600 seconds)
export const SESSION_REMEMBER_MAX_AGE = 60 * 60 * 24 * 14; // 14 days when "Remember Me" is checked
export const SESSION_DEFAULT_MAX_AGE = 60 * 60 * 12;      // 12 hours (1 half day)
export const PREFS_MAX_AGE = 60 * 60 * 24 * 365;
export const REFRESH_THRESHOLD = 60 * 60 * 2;             // 2 hours threshold

export const COOKIE_OPTIONS = {
	httpOnly: true,
	secure: !isDev,
	sameSite: 'lax' as const,
	path: '/',
	maxAge: SESSION_DEFAULT_MAX_AGE
};

export const PREFS_COOKIE_OPTIONS = {
	httpOnly: false,
	secure: !isDev,
	sameSite: 'lax' as const,
	path: '/',
	maxAge: PREFS_MAX_AGE
};

export const PARAGLIDE_COOKIE_OPTIONS = {
	httpOnly: false,
	secure: !isDev,
	sameSite: 'lax' as const,
	path: '/',
	maxAge: PREFS_MAX_AGE
};

import { isDev } from '$lib/utils/isDev';

export const CHECK_AUTH = true;