import { describe, it, expect, vi, beforeEach } from 'vitest';
import { restrictDriver, checkDriverAccess, isDriver, getDriverId } from '$lib/server/auth/driverAuth';
import { createDriverLocals, createAdminLocals, createMockLocals } from '$lib/test/helpers/locals';

describe('driverAuth', () => {
  describe('restrictDriver', () => {
    it('returns driver when authenticated as driver', () => {
      const locals = createDriverLocals();
      const driver = restrictDriver(locals);
      expect(driver).toBeDefined();
      expect(driver.id).toBe('driver-uid');
      expect(driver.role).toBe('driver');
    });

    it('throws when user is admin', () => {
      const locals = createAdminLocals('admin');
      expect(() => restrictDriver(locals)).toThrow('Driver access required');
    });

    it('throws when no user', () => {
      const locals = createMockLocals();
      expect(() => restrictDriver(locals)).toThrow('Driver access required');
    });
  });

  describe('checkDriverAccess', () => {
    it('passes when accessing own data', () => {
      const locals = createDriverLocals();
      expect(() => checkDriverAccess(locals, 'driver-uid')).not.toThrow();
    });

    it('throws when accessing another driver data', () => {
      const locals = createDriverLocals();
      expect(() => checkDriverAccess(locals, 'other-driver-uid')).toThrow('Access denied: can only access own data');
    });

    it('throws for admin', () => {
      const locals = createAdminLocals('admin');
      expect(() => checkDriverAccess(locals, 'driver-uid')).toThrow('Driver access required');
    });
  });

  describe('isDriver', () => {
    it('returns true for driver', () => {
      expect(isDriver(createDriverLocals())).toBe(true);
    });

    it('returns false for admin', () => {
      expect(isDriver(createAdminLocals('admin'))).toBe(false);
    });

    it('returns false for unauthenticated', () => {
      expect(isDriver(createMockLocals())).toBe(false);
    });
  });

  describe('getDriverId', () => {
    it('returns driver id for driver', () => {
      expect(getDriverId(createDriverLocals())).toBe('driver-uid');
    });

    it('returns null for admin', () => {
      expect(getDriverId(createAdminLocals('admin'))).toBeNull();
    });

    it('returns null for unauthenticated', () => {
      expect(getDriverId(createMockLocals())).toBeNull();
    });
  });
});