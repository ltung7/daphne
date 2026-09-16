import { describe, it, expect, vi, beforeEach } from 'vitest';
import { restrictAdmin, requireAdmin, requireManager, requireModerator, isAdmin, isManagerOrAbove, isModeratorOrAbove } from '$lib/server/auth/adminAuth';
import { createAdminLocals, createDriverLocals, createMockLocals, createRevokedLocals } from '$lib/test/helpers/locals';

describe('adminAuth', () => {
  describe('restrictAdmin', () => {
    it('returns user when admin authenticated', () => {
      const locals = createAdminLocals('admin');
      const user = restrictAdmin(locals);
      expect(user).toBeDefined();
      expect(user.role).toBe('admin');
    });

    it('throws when user is driver', () => {
      const locals = createDriverLocals();
      expect(() => restrictAdmin(locals)).toThrow('Admin access required');
    });

    it('throws when no user', () => {
      const locals = createMockLocals();
      expect(() => restrictAdmin(locals)).toThrow('Admin access required');
    });
  });

  describe('requireAdmin', () => {
    it('passes for admin role', () => {
      const locals = createAdminLocals('admin');
      expect(() => requireAdmin(locals)).not.toThrow();
    });

    it('throws for manager role', () => {
      const locals = createAdminLocals('manager');
      expect(() => requireAdmin(locals)).toThrow("Required role: admin, current: manager");
    });

    it('throws for moderator role', () => {
      const locals = createAdminLocals('moderator');
      expect(() => requireAdmin(locals)).toThrow("Required role: admin, current: moderator");
    });
  });

  describe('requireManager', () => {
    it('passes for admin role', () => {
      const locals = createAdminLocals('admin');
      expect(() => requireManager(locals)).not.toThrow();
    });

    it('passes for manager role', () => {
      const locals = createAdminLocals('manager');
      expect(() => requireManager(locals)).not.toThrow();
    });

    it('throws for moderator role', () => {
      const locals = createAdminLocals('moderator');
      expect(() => requireManager(locals)).toThrow("Required role: manager | admin, current: moderator");
    });
  });

  describe('requireModerator', () => {
    it('passes for admin role', () => {
      const locals = createAdminLocals('admin');
      expect(() => requireModerator(locals)).not.toThrow();
    });

    it('passes for manager role', () => {
      const locals = createAdminLocals('manager');
      expect(() => requireModerator(locals)).not.toThrow();
    });

    it('passes for moderator role', () => {
      const locals = createAdminLocals('moderator');
      expect(() => requireModerator(locals)).not.toThrow();
    });
  });

  describe('isAdmin', () => {
    it('returns true for admin', () => {
      const locals = createAdminLocals('admin');
      expect(isAdmin(locals)).toBe(true);
    });

    it('returns false for driver', () => {
      const locals = createDriverLocals();
      expect(isAdmin(locals)).toBe(false);
    });

    it('returns false for unauthenticated', () => {
      const locals = createMockLocals();
      expect(isAdmin(locals)).toBe(false);
    });
  });

  describe('isManagerOrAbove', () => {
    it('returns true for admin', () => {
      expect(isManagerOrAbove(createAdminLocals('admin'))).toBe(true);
    });

    it('returns true for manager', () => {
      expect(isManagerOrAbove(createAdminLocals('manager'))).toBe(true);
    });

    it('returns false for moderator', () => {
      expect(isManagerOrAbove(createAdminLocals('moderator'))).toBe(false);
    });
  });

  describe('isModeratorOrAbove', () => {
    it('returns true for admin', () => {
      expect(isModeratorOrAbove(createAdminLocals('admin'))).toBe(true);
    });

    it('returns true for manager', () => {
      expect(isModeratorOrAbove(createAdminLocals('manager'))).toBe(true);
    });

    it('returns true for moderator', () => {
      expect(isModeratorOrAbove(createAdminLocals('moderator'))).toBe(true);
    });
  });
});