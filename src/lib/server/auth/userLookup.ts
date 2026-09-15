import { getDriver } from '$lib/server/db/firebase/drivers.fdb.js';
import { getUser } from '$lib/server/db/firebase/users.fdb.js';
import type { SessionClaims, UserBase, AuthResult } from './types.js';

export async function resolveUser(uid: string): Promise<AuthResult> {
	// 1. Check drivers collection by id (which is the Firebase UID)
	const driver = await getDriver(uid);

	if (driver) {
		const role = driver.status === 'banned' ? 'revoked' : 'driver';

		const claims: SessionClaims = {
			uid: driver.id,
			email: driver.email,
			role,
			driverId: driver.id,
			emailVerified: true,
			iat: Math.floor(Date.now() / 1000),
			exp: Math.floor(Date.now() / 1000) + 7200
		};

		const now = Date.now();
		const user: UserBase = {
			id: driver.id,
			email: driver.email,
			name: driver.name,
			role,
			preferredLanguage: driver.preferredLanguage || 'en',
			timestamp: now,
			updatedAt: now,
			lastLoggedIn: now
		};

		return {
			userType: 'driver',
			userData: user,
			claims
		};
	}

	// 2. Check admin users collection by id (which is the Firebase UID)
	const admin = await getUser(uid);
	if (admin) {
		const role = admin.role;

		const claims: SessionClaims = {
			uid: admin.id,
			email: admin.email,
			role,
			emailVerified: true,
			iat: Math.floor(Date.now() / 1000),
			exp: Math.floor(Date.now() / 1000) + 7200
		};

		const user: UserBase = {
			id: admin.id,
			email: admin.email,
			name: admin.name,
			role: admin.role,
			preferredLanguage: admin.preferredLanguage || 'pl',
			timestamp: admin.timestamp,
			updatedAt: admin.updatedAt,
			lastLoggedIn: admin.lastLoggedIn || admin.timestamp
		};

		return {
			userType: 'admin',
			userData: user,
			claims
		};
	}

	// 3. Throw if neither found
	throw new Error('User not found in drivers or admin collections');
}

export async function getUserById(uid: string) {
	// Try driver first
	const driver = await getDriver(uid);
	if (driver) {
		const role = driver.status === 'banned' ? 'revoked' : 'driver';

		const now = Date.now();
		return {
			id: driver.id,
			email: driver.email,
			name: driver.name,
			role,
			preferredLanguage: driver.preferredLanguage || 'en',
			timestamp: now,
			updatedAt: now,
			lastLoggedIn: now
		} as UserBase;
	}

	// Try admin
	const admin = await getUser(uid);
	if (admin) {
		return {
			id: admin.id,
			email: admin.email,
			name: admin.name,
			role: admin.role,
			preferredLanguage: admin.preferredLanguage || 'pl',
			timestamp: admin.timestamp,
			updatedAt: admin.updatedAt,
			lastLoggedIn: admin.lastLoggedIn || admin.timestamp
		} as UserBase;
	}

	return null;
}