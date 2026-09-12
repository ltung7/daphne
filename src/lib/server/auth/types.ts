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

export const SESSION_MAX_AGE = 60 * 60 * 2;
export const PREFS_MAX_AGE = 60 * 60 * 24 * 365;
export const REFRESH_THRESHOLD = 1800;

export const COOKIE_OPTIONS = {
	httpOnly: true,
	secure: process.env.NODE_ENV === 'production',
	sameSite: 'lax' as const,
	path: '/',
	maxAge: SESSION_MAX_AGE
};

export const PREFS_COOKIE_OPTIONS = {
	httpOnly: false,
	secure: process.env.NODE_ENV === 'production',
	sameSite: 'lax' as const,
	path: '/',
	maxAge: PREFS_MAX_AGE
};