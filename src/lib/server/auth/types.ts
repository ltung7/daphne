export type UserType = App.UserType;
export type AdminRole = App.AdminRole;

export interface SessionClaims extends App.SessionClaims {
	driverId?: string;
}

export type UserBase = App.UserBase;
export type User = App.User;

export interface AuthResult {
	userType: UserType;
	userData: UserBase;
	claims: SessionClaims;
}

export const ADMIN_COOKIE = 'app.admin.session';
export const DRIVER_COOKIE = 'app.driver.session';
export const PREFS_COOKIE = 'app.prefs';
export const PARAGLIDE_LOCALE_COOKIE = 'PARAGLIDE_LOCALE';

export const SESSION_REMEMBER_MAX_AGE = 60 * 60 * 24 * 14;
export const SESSION_DEFAULT_MAX_AGE = 60 * 60 * 12;
export const PREFS_MAX_AGE = 60 * 60 * 24 * 365;
export const REFRESH_THRESHOLD = 60 * 60 * 2;

import { isDev } from '$lib/utils/isDev';

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

export const CHECK_AUTH = true;