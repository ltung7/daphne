# Testing Plan - Auth Rework

## Overview
This document outlines the testing strategy for the completed authentication rework. Tests are categorized as **Automated** (unit/integration via Vitest) or **Manual** (browser-based, requires Firebase project, real credentials).

---

## 1. Automated Tests (Vitest)

### Setup Required
- Create `vitest.config.ts` with SvelteKit + Playwright browser testing
- Mock Firebase Admin SDK and Firestore
- Test utilities in `src/lib/test/` (mocks, helpers)

### Auth Module Tests (`src/lib/server/auth/*.test.ts`)

| Test File | Description | Priority |
|-----------|-------------|----------|
| `firebaseAdmin.test.ts` | Singleton init, custom claims, token revocation | High |
| `session.test.ts` | Cookie creation, verification, refresh, clearing | High |
| `userLookup.test.ts` | Driver/admin resolution, revoked status mapping | High |
| `adminAuth.test.ts` | restrictAdmin, requireRole, requireAdmin/Manager/Moderator | High |
| `driverAuth.test.ts` | restrictDriver, checkDriverAccess | High |
| `generalAuth.test.ts` | requireAuth (both user types) | Medium |
| `apiAuth.test.ts` | requireDriverApi, requireAdminApi, requireAnyApi, requirePublicApi | High |
| `auth.middleware.test.ts` | Route group detection, cookie verification, revoked redirect, sliding refresh | Critical |

### Service Tests (`src/lib/server/services/*.test.ts`)

| Test File | Description | Priority |
|-----------|-------------|----------|
| `driver.service.test.ts` | addNewDriver (creates Firebase user), changeDriverStatus (banned → revokes tokens) | High |
| `users.service.test.ts` | Admin revocation triggers token revoke + custom claims | High |

### Route Handler Tests (`src/routes/**/*.test.ts`)

| Test File | Description | Priority |
|-----------|-------------|----------|
| `(auth)/login/+page.server.test.ts` | signin, google, forgotPassword actions, redirect logic | Critical |
| `(auth)/logout/+page.server.test.ts` | Clears both cookies, redirects | Medium |
| `(auth)/password-reset/+page.server.test.ts` | Sends Firebase reset email | Medium |
| `(api)/auth/refresh/+server.test.ts` | Token refresh endpoint, revoked check, new exp returned | High |

### Running Automated Tests
```bash
npm run test          # Run all tests once
npm run test:unit     # Watch mode
```

---

## 2. Manual Tests (Browser / E2E)

### Prerequisites
- Local dev server: `npm run dev` (port 4800)
- Firebase project with:
  - Email/Password auth enabled
  - Google provider enabled
  - At least 2 admin users (different roles: admin, manager, moderator)
  - At least 2 driver users (different vehicles)
  - One driver with status `banned`
- Test accounts credentials documented in `docs/test-accounts.md` (not committed)

### Test Scenarios

#### 2.1 Route Access Control
| ID | Scenario | Steps | Expected |
|----|----------|-------|----------|
| M-01 | Driver blocked from admin routes | 1. Login as driver<br>2. Navigate to `/` (admin dashboard) | Redirect to `/login?message=revoked` or `/driver` |
| M-02 | Admin blocked from driver routes | 1. Login as admin<br>2. Navigate to `/driver` | Redirect to `/login` or `/` |
| M-03 | Driver A cannot access Driver B data | 1. Login as Driver A<br>2. Call API `/api/driver/{driverB_id}/...` | 403/401 error |
| M-04 | Admin role hierarchy | 1. Login as moderator<br>2. Access manager-only route | 403 |
| M-05 | Manager can access moderator routes | 1. Login as manager<br>2. Access moderator route | 200 OK |
| M-06 | Admin can access all admin routes | 1. Login as admin<br>2. Access all admin sections | 200 OK |

#### 2.2 Login & Session
| ID | Scenario | Steps | Expected |
|----|----------|-------|----------|
| M-07 | Email/password login (driver) | 1. Go to `/login`<br>2. Enter driver credentials<br>3. Submit | Redirect to `/driver`, `app.driver.session` cookie set |
| M-08 | Email/password login (admin) | 1. Go to `/login`<br>2. Enter admin credentials<br>3. Submit | Redirect to `/`, `app.admin.session` cookie set |
| M-09 | Google Sign-In (driver) | 1. Go to `/login`<br>2. Click "Log in with Google"<br>3. Select driver Google account | Redirect to `/driver` |
| M-10 | Google Sign-In (admin) | 1. Go to `/login`<br>2. Click "Log in with Google"<br>3. Select admin Google account | Redirect to `/` |
| M-11 | Revoked driver blocked | 1. Set driver status to `banned` in Firestore<br>2. Login as that driver | Redirect to `/login?message=revoked`, cookies cleared |
| M-12 | Revoked admin blocked | 1. Delete admin via UI (sets role=revoked)<br>2. Login as that admin | Redirect to `/login?message=revoked` |
| M-13 | Sliding session refresh | 1. Login<br>2. Wait until cookie near expiry (or manipulate exp)<br>3. Make request | New cookie issued, `exp` extended |
| M-14 | Background refresh (client) | 1. Login<br>2. Leave tab open > 2 hours<br>3. Click around | No re-login prompt, session maintained |

#### 2.3 Logout & Password Reset
| ID | Scenario | Steps | Expected |
|----|----------|-------|----------|
| M-15 | Logout clears both cookies | 1. Login as admin<br>2. Login as driver in another tab<br>3. Click logout in admin tab | Both tabs redirect to `/login`, cookies gone |
| M-16 | Password reset flow | 1. Go to `/login`<br>2. Click "Forgot password?"<br>3. Enter email<br>4. Check email, click link<br>5. Set new password<br>6. Login with new password | Success at each step |

#### 2.4 API Auth (Per-Handler)
| ID | Scenario | Steps | Expected |
|----|----------|-------|----------|
| M-17 | Driver API requires driver cookie | 1. Call `/api/driver/profile` without cookie | 401 |
| M-18 | Driver API works with driver cookie | 1. Login as driver<br>2. Call `/api/driver/profile` | 200, returns driver data |
| M-19 | Admin API requires admin cookie | 1. Call `/api/admin/stats` without cookie | 401 |
| M-20 | Admin API role check | 1. Login as moderator<br>2. Call manager-only admin API | 403 |
| M-21 | Shared API accepts both | 1. Call `/api/shared/...` as driver → 200<br>2. Call as admin → 200 | Both work |
| M-22 | Public API no auth | 1. Call `/api/public/...` without auth | 200 |

#### 2.5 Webhooks (No Session Auth)
| ID | Scenario | Steps | Expected |
|----|----------|-------|----------|
| M-23 | Uber webhook works without cookies | 1. POST to `/webhooks/uber` with valid HMAC | 200, processed |
| M-24 | Bolt webhook works without cookies | 1. POST to `/webhooks/bolt` with valid HMAC | 200, processed |
| M-25 | Webhook rejects invalid signature | 1. POST to webhook with bad HMAC | 401/400 |

#### 2.6 General Routes (Both User Types)
| ID | Scenario | Steps | Expected |
|----|----------|-------|----------|
| M-26 | Driver accesses /profile | 1. Login as driver<br>2. Go to `/profile` (in (general)) | 200, shows driver profile |
| M-27 | Admin accesses /profile | 1. Login as admin<br>2. Go to `/profile` | 200, shows admin profile |
| M-28 | Notifications accessible by both | 1. Login as driver → `/notifications`<br>2. Login as admin → `/notifications` | Both 200 |

#### 2.7 i18n / Locale
| ID | Scenario | Steps | Expected |
|----|----------|-------|----------|
| M-29 | Driver sees preferred language | 1. Set driver.preferredLanguage = 'uk'<br>2. Login as driver<br>3. Check `/driver` UI | Ukrainian translations shown |
| M-30 | Admin always Polish | 1. Login as admin<br>2. Check any admin page | Polish (pl) shown |
| M-31 | Locale cookie set on login | 1. Login as driver with preferredLanguage='ro'<br>2. Check `PARAGLIDE_LOCALE` cookie | Value = 'ro' |

#### 2.8 Revocation Immediate Effect
| ID | Scenario | Steps | Expected |
|----|----------|-------|----------|
| M-32 | Driver banned → immediate logout | 1. Login as driver<br>2. In another tab, admin bans driver (status=banned)<br>3. Driver makes request | Request fails, redirect to login |
| M-33 | Admin revoked → immediate logout | 1. Login as admin<br>2. In another tab, superadmin deletes admin<br>3. Admin makes request | Request fails, redirect to login |

---

## 3. Test Execution Order

### Phase 1: Automated (CI/CD)
```bash
npm run check          # TypeScript + Svelte check
npm run lint           # Linting
npm run test           # Unit/integration tests
npm run build          # Production build
```

### Phase 2: Manual (Pre-deployment)
1. Start dev server: `npm run dev`
2. Execute M-01 through M-33 in order
3. Document results in `docs/test-results-<date>.md`

### Phase 3: Smoke Test (Post-deploy)
- Run M-07, M-08, M-15, M-17, M-19, M-21, M-23 on production

---

## 4. Mock Strategy for Automated Tests

### Firebase Admin Mock
```typescript
// src/lib/test/mocks/firebaseAdmin.ts
export const mockFirebaseAuth = {
  createUser: vi.fn(),
  verifyIdToken: vi.fn(),
  verifySessionCookie: vi.fn(),
  revokeRefreshTokens: vi.fn(),
  setCustomUserClaims: vi.fn(),
  getUserByEmail: vi.fn(),
};
```

### Firestore Mock
```typescript
// src/lib/test/mocks/firestore.ts
export const mockGetDriver = vi.fn();
export const mockGetUser = vi.fn();
export const mockSetDriver = vi.fn();
export const mockUpdateDriver = vi.fn();
```

### SvelteKit Locals Helper
```typescript
// src/lib/test/helpers/locals.ts
export function createMockLocals(overrides: Partial<App.Locals> = {}): App.Locals {
  return {
    userType: null,
    user: null,
    driver: null,
    sessionClaims: null,
    locale: 'pl',
    ...overrides,
  };
}
```

---

## 5. Coverage Targets

| Category | Target |
|----------|--------|
| Auth module (src/lib/server/auth) | 95% |
| Auth middleware | 90% |
| API auth helpers | 90% |
| Driver/Admin services (revocation) | 85% |
| Route handlers (login, logout, refresh) | 80% |

---

## 6. Notes

- **Automated tests** run in CI on every PR
- **Manual tests** required before each release
- **Firebase Emulator** recommended for automated integration tests (future improvement)
- Document any flaky tests and root causes
- Update this plan when new auth features are added