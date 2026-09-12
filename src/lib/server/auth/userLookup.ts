import { findDrivers } from '$lib/server/db/firebase/drivers.fdb.js';
import { findUsers } from '$lib/server/db/firebase/users.fdb.js';
import type { SessionClaims, UserBase, AuthResult } from './types.js';

export async function resolveUser(uid: string): Promise<AuthResult> {
	// 1. Check drivers collection by id (which is the Firebase UID)
	const drivers = await findDrivers({ id: uid }, [ 'id', 'login', 'email', 'name', 'phone', 'nationality', 'preferredLanguage', 'status' ]);
	
	if (drivers.length > 0) {
		const driver = drivers[0];
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
	const admins = await findUsers({ id: uid }, [ 'id', 'email', 'name', 'role', 'preferredLanguage', 'timestamp', 'updatedAt', 'lastLoggedIn' ]);
	
	if (admins.length > 0) {
		const admin = admins[0];
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
			preferredLanguage: admin.preferredLanguage || 'en',
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
	const drivers = await findDrivers({ id: uid }, [ 'id', 'login', 'email', 'name', 'phone', 'nationality', 'preferredLanguage', 'status' ]);
	if (drivers.length > 0) {
		const driver = drivers[0];
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
	const admins = await findUsers({ id: uid }, [ 'id', 'email', 'name', 'role', 'preferredLanguage', 'timestamp', 'updatedAt', 'lastLoggedIn' ]);
	if (admins.length > 0) {
		const admin = admins[0];
		return {
			id: admin.id,
			email: admin.email,
			name: admin.name,
			role: admin.role,
			preferredLanguage: admin.preferredLanguage || 'en',
			timestamp: admin.timestamp,
			updatedAt: admin.updatedAt,
			lastLoggedIn: admin.lastLoggedIn || admin.timestamp
		} as UserBase;
	}
	
	return null;
}