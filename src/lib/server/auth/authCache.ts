import type { UserBase } from './types.js';

interface CacheEntry {
	user: UserBase;
	expiresAt: number;
}

const DEFAULT_TTL_MS = 10 * 60 * 1000; // 10 minutes

class AuthCache {
	private userCache = new Map<string, CacheEntry>();
	private bannedUids = new Set<string>();
	private initialized = false;

	/**
	 * Check if a user is explicitly banned or revoked in-memory (0ms check)
	 */
	isBanned(uid: string): boolean {
		return this.bannedUids.has(uid);
	}

	/**
	 * Mark user as banned/revoked immediately, clearing any cached profile
	 */
	banUser(uid: string): void {
		this.bannedUids.add(uid);
		this.userCache.delete(uid);
	}

	/**
	 * Unban a user, clearing ban status and cached profile
	 */
	unbanUser(uid: string): void {
		this.bannedUids.delete(uid);
		this.userCache.delete(uid);
	}

	/**
	 * Get cached user profile if present and not expired
	 */
	getUser(uid: string): UserBase | null {
		if (this.bannedUids.has(uid)) return null;

		const entry = this.userCache.get(uid);
		if (!entry) return null;

		if (Date.now() > entry.expiresAt) {
			this.userCache.delete(uid);
			return null;
		}

		return entry.user;
	}

	/**
	 * Cache a validated user profile
	 */
	setUser(uid: string, user: UserBase, ttlMs: number = DEFAULT_TTL_MS): void {
		if (user.role === 'revoked') {
			this.banUser(uid);
			return;
		}

		this.userCache.set(uid, {
			user,
			expiresAt: Date.now() + ttlMs
		});
	}

	/**
	 * Evict a user from cache (e.g. on profile update)
	 */
	invalidateUser(uid: string): void {
		this.userCache.delete(uid);
	}

	/**
	 * Lazy-load known banned drivers and revoked admin users from Firestore once on startup
	 */
	async ensureInitialized(): Promise<void> {
		if (this.initialized) return;
		this.initialized = true;

		try {
			const { findDrivers } = await import('$lib/server/db/firebase/drivers.fdb.js');
			const { findUsers } = await import('$lib/server/db/firebase/users.fdb.js');

			const [ bannedDrivers, revokedUsers ] = await Promise.all([
				findDrivers({ status: 'banned' as any }).catch(() => []),
				findUsers({ role: 'revoked' as any }).catch(() => [])
			]);

			for (const driver of bannedDrivers) {
				if (driver.id) this.bannedUids.add(driver.id);
			}

			for (const user of revokedUsers) {
				if (user.id) this.bannedUids.add(user.id);
			}
		} catch (err) {
			console.warn('[AuthCache] Failed to preload banned users:', err);
		}
	}

	/**
	 * Periodic cleanup of expired cache entries
	 */
	cleanup(): void {
		const now = Date.now();
		for (const [ uid, entry ] of this.userCache.entries()) {
			if (now > entry.expiresAt) {
				this.userCache.delete(uid);
			}
		}
	}

	/**
	 * Clear all caches (useful for testing)
	 */
	clear(): void {
		this.userCache.clear();
		this.bannedUids.clear();
		this.initialized = false;
	}
}

export const authCache = new AuthCache();

// Periodic cleanup of expired cache entries every 15 minutes
if (typeof setInterval !== 'undefined') {
	const interval = setInterval(() => {
		authCache.cleanup();
	}, 15 * 60 * 1000);
	if (interval.unref) interval.unref();
}
