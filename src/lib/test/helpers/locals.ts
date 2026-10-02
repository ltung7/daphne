type Locals = App.Locals;
type AdminRole = App.AdminRole;

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
      canAproveSettlements: true,
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