import { describe, it, expect, vi } from 'vitest';
import { requireDriverApi, requireAdminApi, requireAnyApi, requirePublicApi } from '$lib/server/auth/apiAuth';
import { createDriverLocals, createAdminLocals, createMockLocals } from '$lib/test/helpers/locals';

describe('apiAuth', () => {
  describe('requireDriverApi', () => {
    it('returns driver when authenticated as driver', () => {
      const locals = createDriverLocals();
      const driver = requireDriverApi(locals);
      expect(driver).toBeDefined();
      expect(driver.id).toBe('driver-uid');
    });

    it('throws for admin', () => {
      const locals = createAdminLocals('admin');
      expect(() => requireDriverApi(locals)).toThrow('Driver access required');
    });

    it('throws for unauthenticated', () => {
      const locals = createMockLocals();
      expect(() => requireDriverApi(locals)).toThrow('Driver access required');
    });
  });

  describe('requireAdminApi', () => {
    it('returns admin when authenticated as admin', () => {
      const locals = createAdminLocals('admin');
      const admin = requireAdminApi(locals);
      expect(admin).toBeDefined();
      expect(admin.role).toBe('admin');
    });

    it('returns manager when authenticated as manager', () => {
      const locals = createAdminLocals('manager');
      const admin = requireAdminApi(locals);
      expect(admin.role).toBe('manager');
    });

    it('throws when role not allowed', () => {
      const locals = createAdminLocals('moderator');
      expect(() => requireAdminApi(locals, ['admin'])).toThrow("Required role: admin, current: moderator");
    });

    it('passes when role allowed', () => {
      const locals = createAdminLocals('admin');
      expect(() => requireAdminApi(locals, ['admin', 'manager'])).not.toThrow();
    });

    it('throws for driver', () => {
      const locals = createDriverLocals();
      expect(() => requireAdminApi(locals)).toThrow('Admin access required');
    });

    it('throws for unauthenticated', () => {
      const locals = createMockLocals();
      expect(() => requireAdminApi(locals)).toThrow('Admin access required');
    });
  });

  describe('requireAnyApi', () => {
    it('returns driver for driver', () => {
      const locals = createDriverLocals();
      const result = requireAnyApi(locals);
      expect(result.userType).toBe('driver');
      expect(result.user.id).toBe('driver-uid');
    });

    it('returns admin for admin', () => {
      const locals = createAdminLocals('admin');
      const result = requireAnyApi(locals);
      expect(result.userType).toBe('admin');
      expect(result.user.id).toBe('admin-uid');
    });

    it('throws for unauthenticated', () => {
      const locals = createMockLocals();
      expect(() => requireAnyApi(locals)).toThrow('Authentication required');
    });
  });

  describe('requirePublicApi', () => {
    it('does nothing for any locals', () => {
      expect(() => requirePublicApi(createMockLocals())).not.toThrow();
      expect(() => requirePublicApi(createDriverLocals())).not.toThrow();
      expect(() => requirePublicApi(createAdminLocals('admin'))).not.toThrow();
    });
  });
});