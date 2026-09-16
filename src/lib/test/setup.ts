import { vi } from 'vitest';
import '@testing-library/jest-dom/vitest';

vi.mock('$env/static/private', () => ({
  NODE_ENV: 'development',
  FIREBASE_PROJECT_ID: 'test-project',
  FIREBASE_CLIENT_EMAIL: 'test@test.iam.gserviceaccount.com',
  FIREBASE_PRIVATE_KEY: '-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQD...\n-----END PRIVATE KEY-----\n',
  FIREBASE_API_KEY: 'test-api-key',
  FIREBASE_AUTH_DOMAIN: 'test.firebaseapp.com',
}));

vi.mock('$env/dynamic/private', () => ({
  env: {
    NODE_ENV: 'development',
  },
}));

vi.mock('$lib/server/db/firebase/drivers.fdb', () => ({
  getDriver: vi.fn(),
  setDriver: vi.fn(),
  updateDriver: vi.fn(),
  deleteDriver: vi.fn(),
  findDrivers: vi.fn(),
}));

vi.mock('$lib/server/db/firebase/users.fdb', () => ({
  getUser: vi.fn(),
  setUser: vi.fn(),
  updateUser: vi.fn(),
  deleteUser: vi.fn(),
  findUsers: vi.fn(),
}));

vi.mock('$lib/server/db/firebase/vehicles.fdb', () => ({
  getVehicle: vi.fn(),
  setVehicle: vi.fn(),
  updateVehicle: vi.fn(),
  findVehicles: vi.fn(),
}));

vi.mock('$lib/server/auth/firebaseAdmin', () => ({
  getFirebaseAuth: vi.fn(() => ({
    createUser: vi.fn(),
    verifyIdToken: vi.fn(),
    verifySessionCookie: vi.fn(),
    revokeRefreshTokens: vi.fn(),
    setCustomUserClaims: vi.fn(),
    getUserByEmail: vi.fn(),
  })),
  revokeRefreshTokens: vi.fn(),
  setCustomClaims: vi.fn(),
  verifyIdToken: vi.fn(),
  verifySessionCookie: vi.fn(),
  createSessionCookie: vi.fn(),
}));

vi.mock('$lib/server/auth/session', () => ({
  createSessionCookie: vi.fn(),
  verifySessionCookie: vi.fn(),
  refreshSessionCookie: vi.fn(),
  clearSessionCookie: vi.fn(),
  clearAllSessionCookies: vi.fn(),
  setPrefsCookie: vi.fn(),
  getPrefsCookie: vi.fn(),
  setSessionAndPrefs: vi.fn(),
}));

Object.defineProperty(globalThis, 'RequestEvent', {
  value: class RequestEvent {
    cookies = {
      get: vi.fn(),
      set: vi.fn(),
      delete: vi.fn(),
    };
    locals = {};
    route = { id: '' };
    url = new URL('http://localhost');
    request = new Request('http://localhost');
  },
});