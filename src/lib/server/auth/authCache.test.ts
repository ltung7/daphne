import { describe, it, expect, beforeEach, vi } from 'vitest';
import { authCache } from './authCache';
import type { UserBase } from './types';

describe('authCache', () => {
	const mockUser: UserBase = {
		id: 'user-123',
		email: 'test@example.com',
		name: 'Test User',
		role: 'admin',
		preferredLanguage: 'pl',
		timestamp: Date.now(),
		updatedAt: Date.now(),
		lastLoggedIn: Date.now()
	};

	beforeEach(() => {
		authCache.clear();
	});

	it('should return null for non-cached user', () => {
		expect(authCache.getUser('non-existent')).toBeNull();
	});

	it('should cache and retrieve user profile', () => {
		authCache.setUser('user-123', mockUser);
		const cached = authCache.getUser('user-123');
		expect(cached).toEqual(mockUser);
	});

	it('should expire user cache when TTL elapses', () => {
		vi.useFakeTimers();
		try {
			authCache.setUser('user-123', mockUser, 1000); // 1 second TTL
			expect(authCache.getUser('user-123')).toEqual(mockUser);

			vi.advanceTimersByTime(1001);
			expect(authCache.getUser('user-123')).toBeNull();
		} finally {
			vi.useRealTimers();
		}
	});

	it('should immediately ban user and evict from cache', () => {
		authCache.setUser('user-123', mockUser);
		expect(authCache.getUser('user-123')).not.toBeNull();

		authCache.banUser('user-123');
		expect(authCache.isBanned('user-123')).toBe(true);
		expect(authCache.getUser('user-123')).toBeNull();
	});

	it('should automatically ban user when cached with role revoked', () => {
		const revokedUser: UserBase = { ...mockUser, role: 'revoked' };
		authCache.setUser('user-revoked', revokedUser);

		expect(authCache.isBanned('user-revoked')).toBe(true);
		expect(authCache.getUser('user-revoked')).toBeNull();
	});

	it('should unban user', () => {
		authCache.banUser('user-123');
		expect(authCache.isBanned('user-123')).toBe(true);

		authCache.unbanUser('user-123');
		expect(authCache.isBanned('user-123')).toBe(false);
	});

	it('should invalidate specific user from cache', () => {
		authCache.setUser('user-123', mockUser);
		authCache.invalidateUser('user-123');
		expect(authCache.getUser('user-123')).toBeNull();
	});

	it('should clean up expired entries in cleanup()', () => {
		vi.useFakeTimers();
		try {
			authCache.setUser('user-1', mockUser, 500);
			authCache.setUser('user-2', { ...mockUser, id: 'user-2' }, 2000);

			vi.advanceTimersByTime(600);
			authCache.cleanup();

			expect(authCache.getUser('user-1')).toBeNull();
			expect(authCache.getUser('user-2')).not.toBeNull();
		} finally {
			vi.useRealTimers();
		}
	});
});
