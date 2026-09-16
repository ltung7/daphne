import { vi } from 'vitest';

// Match exactly src/app.d.ts App.Locale
type Locale = 'en' | 'pl' | 'hi' | 'ne' | 'uk' | 'be' | 'uz' | 'ka' | 'tl' | 'ro';

type AdminRole = 'moderator' | 'manager' | 'admin';

interface SessionClaims {
  uid: string;
  email: string;
  role: AdminRole | 'driver' | 'revoked';
  driverId?: string;
  emailVerified: boolean;
  iat: number;
  exp: number;
}

interface UserBase {
  id: string;
  email: string;
  name: string;
  role: AdminRole | 'driver' | 'revoked';
  preferredLanguage: Locale;
  timestamp: number;
  updatedAt: number;
  lastLoggedIn: number;
}

interface User extends UserBase {
  role: AdminRole | 'revoked';
  canSignHandovers: boolean;
}

interface Locals {
  _userType: 'driver' | 'admin' | null;
  _user: User | null;
  _driver: UserBase | null;
  sessionClaims: SessionClaims | null;
  locale: Locale;
}

export function createMockLocals(overrides: Partial<Locals> = {}): Locals {
  return {
    _userType: null,
    _user: null,
    _driver: null,
    sessionClaims: null,
    locale: 'pl',
    ...overrides,
  };
}

export function createAdminLocals(role: AdminRole = 'admin', overrides: Partial<Locals> = {}): Locals {
  return createMockLocals({
    _userType: 'admin',
    _user: {
      id: 'admin-uid',
      email: 'admin@test.com',
      name: 'Test Admin',
      role,
      preferredLanguage: 'pl',
      timestamp: Date.now(),
      updatedAt: Date.now(),
      lastLoggedIn: Date.now(),
      canSignHandovers: true,
    },
    sessionClaims: {
      uid: 'admin-uid',
      email: 'admin@test.com',
      role,
      emailVerified: true,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 7200,
    },
    ...overrides,
  });
}

export function createDriverLocals(overrides: Partial<Locals> = {}): Locals {
  return createMockLocals({
    _userType: 'driver',
    _driver: {
      id: 'driver-uid',
      email: 'driver@test.com',
      name: 'Test Driver',
      role: 'driver',
      preferredLanguage: 'en',
      timestamp: Date.now(),
      updatedAt: Date.now(),
      lastLoggedIn: Date.now(),
    },
    sessionClaims: {
      uid: 'driver-uid',
      email: 'driver@test.com',
      role: 'driver',
      driverId: 'driver-uid',
      emailVerified: true,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 7200,
    },
    ...overrides,
  });
}

export function createRevokedLocals(userType: 'driver' | 'admin' = 'driver'): Locals {
  const base = userType === 'driver' ? createDriverLocals() : createAdminLocals('admin');
  return {
    ...base,
    sessionClaims: {
      ...base.sessionClaims!,
      role: 'revoked',
    },
  };
}