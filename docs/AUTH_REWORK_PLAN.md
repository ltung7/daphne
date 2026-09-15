# Auth Framework Rework Plan

## Overview
Complete rewrite of authentication system using Firebase Authentication as the identity provider, with separate session cookies for drivers and admin users, single login page, and proper TypeScript types.

---

## 1. Type Definitions (src/app.d.ts)

### 1.1 Remove Legacy Types
The following are relics and should be **removed entirely**:
- App.Locals (current: admin, subRoute, auth)
- App.Error
- App.BaseUserData
- App.UserRoles (admin | streamer | revoked | superadmin)
- App.User

### 1.2 New App Namespace Types
```typescript
namespace App {
  // Locale for i18n (moved from DocumentGenerator.Locale)
  type Locale = 'en' | 'pl' | 'uk' | 'be' | 'ru' | 'ro' | 'bg' | 'uz' | 'ka';

  // User type discriminator
  type UserType = 'driver' | 'admin';

  // Admin user roles
  type AdminRole = 'moderator' | 'manager' | 'admin';

  // Session cookie payload (decoded from Firebase session cookie)
  interface SessionClaims {
    uid: string;
    email: string;
    role: AdminRole | 'driver' | 'revoked';
    driverId?: string;        // Only for drivers
    emailVerified: boolean;
    iat: number;
    exp: number;
  }

  // Locals populated by hooks.server.ts
  interface Locals {
    userType: UserType | null;      // 'driver' | 'admin' | null
    user: AdminUser | null;         // Admin user data (when userType === 'admin')
    driver: Driver | null;          // Driver data (when userType === 'driver')
    sessionClaims: SessionClaims | null;
  }

  // Admin user (from user collection)
  interface AdminUser {
    id: string;
    email: string;
    name: string;
    role: AdminRole;
    preferredLanguage: Locale;
    createdAt: number;
    updatedAt: number;
  }

  // Driver user (from vehicleDriver collection) - extends existing Driver interface
  interface Driver {
    id: string;
    firebaseUid: string;            // Link to Firebase Auth
    login: string;
    email: string;
    name: string;
    phone: string;
    nationality: string;            // ISO 3166-1 alpha-2
    preferredLanguage: Locale;      // Default: 'en'
    status: Driver.Status;
    // ... existing Driver fields (balance, earnings, etc.)
  }
}
```

### 1.3 Driver Interface Updates (src/app.d.ts -> Driver namespace)
Add to Driver.NewDriverData and Driver.Driver:
```typescript
firebaseUid: string;           // Required - links to Firebase Auth
preferredLanguage: App.Locale; // Default: 'en'
```

---

## 2. Firebase Auth Module (src/lib/server/auth/)

`
src/lib/server/auth/
+�� index.ts                 # Public exports
+�� firebaseAdmin.ts         # Admin SDK initialization
+�� session.ts               # Session cookie management
+�� userLookup.ts            # Resolve user type after auth
+�� adminAuth.ts             # Admin authorization helpers
+�� driverAuth.ts            # Driver authorization helpers
L�� types.ts                 # Shared auth types
`

### 2.1 firebaseAdmin.ts
- Initialize Firebase Admin SDK (singleton)
- Export getAuth() for custom claims, user management

### 2.2 session.ts
```typescript
// Cookie names (changed from portal.ls.auth / driver.ls.auth)
const ADMIN_COOKIE = 'app.admin.session';
const DRIVER_COOKIE = 'app.driver.session';
const PREFS_COOKIE = 'app.prefs';        // locale + mode (signed, httpOnly: false)

// Create session cookie from Firebase ID token
async function createSessionCookie(idToken: string, userType: 'admin' | 'driver'): Promise<string>

// Verify session cookie, return decoded claims
async function verifySessionCookie(cookieValue: string, userType: 'admin' | 'driver'): Promise<App.SessionClaims>

// Refresh session cookie (sliding expiry)
async function refreshSessionCookie(event: RequestEvent): Promise<void>

// Clear session cookie
async function clearSessionCookie(cookies: Cookies, userType: 'admin' | 'driver'): Promise<void>

// Set prefs cookie (locale, mode)
async function setPrefsCookie(cookies: Cookies, prefs: { locale: App.Locale; mode: 'light' | 'dark' }): Promise<void>
```

**Cookie options:**
- httpOnly: true (session cookies)
- httpOnly: false (prefs cookie — read by client for SSR)
- secure: true (production)
- sameSite: 'lax'
- path: '/'
- maxAge: 60 * 60 * 2 (2 hours, sliding) for sessions; 365 days for prefs

### 2.3 userLookup.ts
 ```typescript
 // Single entry point after Firebase Auth verification
 async function resolveUser(firebaseUid: string): Promise<{
   userType: 'driver' | 'admin';
   userData: App.AdminUser | Driver.Driver;
   claims: App.SessionClaims;
 }> {
   // 1. Check drivers collection by firebaseUid
   // 2. Check admin users collection by firebaseUid
   // 3. Throw if neither found
   // 4. If driver.status === 'revoked' or admin.status === 'revoked', set claims.role = 'revoked'
 }
 ```

### 2.4 adminAuth.ts
 ```typescript
 // Used in (admin)/+layout.ts load function
 function restrictAdmin(locals: App.Locals): App.AdminUser
 
 // Used in +page.server.ts for specific permissions
 function requireRole(locals: App.Locals, roles: App.AdminRole[]): void
 function requireAdmin(locals: App.Locals): void      // role === 'admin'
 function requireManager(locals: App.Locals): void    // role === 'manager' | 'admin'
 function requireModerator(locals: App.Locals): void  // any admin role (moderator | manager | admin)
 ```
 
 ### 2.5 driverAuth.ts
 ```typescript
 // Used in (driver)/+layout.ts load function
 function restrictDriver(locals: App.Locals): Driver.Driver
 
 // Ensures driver can only access own data
 function checkDriverAccess(locals: App.Locals, targetDriverId: string): void
 ```
 
 ### 2.6 generalAuth.ts (NEW)
 ```typescript
 // Used in (general)/+layout.ts load function
 function requireAuth(locals: App.Locals): App.AdminUser | Driver.Driver
 ```
 
 ### 2.7 apiAuth.ts (NEW)
 ```typescript
 // For use in (api) route handlers - per-route auth decisions
 function requireDriverApi(locals: App.Locals): Driver.Driver
 function requireAdminApi(locals: App.Locals, allowedRoles?: App.AdminRole[]): App.AdminUser
 function requireAnyApi(locals: App.Locals): { user: App.AdminUser | Driver.Driver; userType: 'driver' | 'admin' }
 function requirePublicApi(locals: App.Locals): void  // no auth required
 ```

---

## 3. Auth Middleware (src/lib/server/secure/auth.middleware.ts) - IMPLEMENTED

Central authentication handler for all requests (moved from hooks.server.ts):

```typescript
export const authMiddleware: Handle = async ({ event, resolve }) => {
  const routeId = event.route.id ?? '';
  
  // Detect route group
  const isAuthRoute = routeId.startsWith('/(auth)');
  const isDriverRoute = routeId.startsWith('/(driver)');
  const isAdminRoute = routeId.startsWith('/(admin)');
  const isGeneralRoute = routeId.startsWith('/(general)');
  const isApiRoute = routeId.startsWith('/(api)');
  const isWebhookRoute = routeId.startsWith('/(webhooks)');

  // Webhooks & API: NO automatic cookie verification in hooks
  // Individual handlers decide auth requirements
  if (isWebhookRoute || isApiRoute) {
    return resolve(event);
  }

  let claims: App.SessionClaims | null = null;
  let userType: 'driver' | 'admin' | null = null;

  if (isDriverRoute) {
    const cookie = event.cookies.get(DRIVER_COOKIE);
    if (cookie) claims = await verifySessionCookie(cookie, 'driver');
    userType = 'driver';
  } else if (isAdminRoute) {
    const cookie = event.cookies.get(ADMIN_COOKIE);
    if (cookie) claims = await verifySessionCookie(cookie, 'admin');
    userType = 'admin';
  } else if (isGeneralRoute || !isAuthRoute) {
    // Try both cookies
    const driverCookie = event.cookies.get(DRIVER_COOKIE);
    if (driverCookie) {
      claims = await verifySessionCookie(driverCookie, 'driver');
      userType = 'driver';
    } else {
      const adminCookie = event.cookies.get(ADMIN_COOKIE);
      if (adminCookie) {
        claims = await verifySessionCookie(adminCookie, 'admin');
        userType = 'admin';
      }
    }
  }

  // Fast-path revoked rejection
  if (claims?.role === 'revoked') {
    await clearAllSessionCookies(event.cookies);
    throw redirect(302, '/login?revoked=true');
  }

  event.locals.sessionClaims = claims;
  event.locals._userType = claims ? userType : null;

  if (claims) {
    const user = await getUserById(claims.uid);
    if (user) {
      if (userType === 'driver') {
        event.locals._driver = user;
      } else {
        event.locals._user = {
          ...user,
          canSignHandovers: true // default for admins
        } as unknown as App.User;
      }
    }
  }

  // Sliding refresh
  if (claims && (claims.exp - Date.now() / 1000) < 1800) {
    await refreshSessionCookie(event);
  }

  return resolve(event);
};
```

**`src/hooks.server.ts`** - Sequences the middleware:
```typescript
export const handle = sequence(
	handleBlanks,
	handleApiHeader,
	authMiddleware
);
```

---

## 4. Route Structure
 
 ```typescript
 export const handle: Handle = async ({ event, resolve }) => {
   const routeId = event.route.id ?? '';
   
   // Detect route group
   const isAuthRoute = routeId.startsWith('/(auth)');
   const isDriverRoute = routeId.startsWith('/(driver)');
   const isAdminRoute = routeId.startsWith('/(admin)');
   const isGeneralRoute = routeId.startsWith('/(general)');
   const isApiRoute = routeId.startsWith('/(api)');
   const isWebhookRoute = routeId.startsWith('/(webhooks)');
 
   // Webhooks & API: NO automatic cookie verification in hooks
   // Individual handlers decide auth requirements
   if (isWebhookRoute || isApiRoute) {
     return resolve(event);
   }
 
   let claims: App.SessionClaims | null = null;
   let userType: 'driver' | 'admin' | null = null;
 
   if (isDriverRoute) {
     const cookie = event.cookies.get(DRIVER_COOKIE);
     if (cookie) claims = await verifySessionCookie(cookie, 'driver');
     userType = 'driver';
   } else if (isAdminRoute) {
     const cookie = event.cookies.get(ADMIN_COOKIE);
     if (cookie) claims = await verifySessionCookie(cookie, 'admin');
     userType = 'admin';
   } else if (isGeneralRoute || !isAuthRoute) {
     // Try both cookies
     const driverCookie = event.cookies.get(DRIVER_COOKIE);
     if (driverCookie) {
       claims = await verifySessionCookie(driverCookie, 'driver');
       userType = 'driver';
     } else {
       const adminCookie = event.cookies.get(ADMIN_COOKIE);
       if (adminCookie) {
         claims = await verifySessionCookie(adminCookie, 'admin');
         userType = 'admin';
       }
     }
   }
 
   // Fast-path revoked rejection
   if (claims?.role === 'revoked') {
     // Clear cookies
     event.cookies.delete(ADMIN_COOKIE, { path: '/' });
     event.cookies.delete(DRIVER_COOKIE, { path: '/' });
     throw redirect(302, '/login?revoked=true');
   }
 
   event.locals.sessionClaims = claims;
   event.locals._userType = claims ? userType : null;
 
   if (claims) {
     if (userType === 'driver') {
       event.locals._driver = await getDriverByFirebaseUid(claims.uid);
     } else {
       event.locals._user = await getAdminByFirebaseUid(claims.uid);
     }
   }
 
   // Sliding refresh
   if (claims && (claims.exp - Date.now() / 1000) < 1800) {
     await refreshSessionCookie(event);
   }
 
   return resolve(event);
 };
 ```

---

## 4. Route Structure
 
 ```
 src/routes/
 +�� (auth)/                    # Public routes (no auth required)
 -   +�� +layout.ts            # No auth check
 -   +�� login/
 -   -   +�� +page.svelte      # Single login form (email/password + Google)
 -   -   L�� +page.server.ts   # Login action, password reset action
 -   +�� password-reset/
 -   -   +�� +page.svelte      # Request reset email
 -   -   L�� +page.server.ts   # Send reset email action
 -   L�� logout/
 -       L�� +page.server.ts   # Clear both cookies, redirect to /login
 
 +�� (driver)/                  # Driver routes (driver role only)
 -   +�� +layout.ts            # restrictDriver(locals) + setLocale(driver.preferredLanguage)
 -   +�� +page.svelte          # Driver dashboard
 -   +�� reports/
 -   +�� settlements/
 -   +�� documents/
 -   +�� vehicle/
 -   +�� profile/
 -   L�� ...
 
 +�� (admin)/                   # Admin routes (moderator/manager/admin)
 -   +�� +layout.ts            # restrictAdmin(locals) - redirects to /login
 -   +�� +page.svelte          # Admin dashboard
 -   +�� drivers/
 -   +�� vehicles/
 -   +�� finance/
 -   +�� integrations/
 -   L�� ...
 
 +�� (general)/                 # Any authenticated user (driver OR admin)
     +�� +layout.ts            # requireAuth(locals) - accepts both
     +�� profile/
     +�� notifications/
     L�� ...
 
 +�� (api)/                     # API endpoints - PER-ROUTE AUTH (no auto auth in hooks)
     +�� +layout.ts            # No auth middleware - handlers decide
     +�� driver/               # Driver-scoped (requireDriverApi in handler)
     +�� admin/                # Admin-scoped (requireAdminApi in handler)
     +�� shared/               # Both driver + admin (requireAnyApi in handler)
     +�� public/               # No auth required (requirePublicApi in handler)
     L�� ...
 
 L�� (webhooks)/                # Webhook endpoints - NO SESSION AUTH
     +�� +layout.ts            # No auth - verify HMAC/signature per handler
     +�� uber/
     +�� bolt/
     +�� telemetry/
     L�� ...
 ```
 
 ### 4.1 Route Group Detection
 - (auth) -> no auth, public
 - (driver) -> requires driver role, cookie: app.driver.session
 - (admin) -> requires admin role (moderator/manager/admin), cookie: app.admin.session
 - (general) -> requires any authenticated user, accepts both cookies
 - (api) -> NO automatic auth, per-handler decision
 - (webhooks) -> NO session auth, signature verification per handler

---

## 5. Login Page (src/routes/(auth)/login/)

### 5.1 Single Form (+page.svelte)
- Email/password fields
- Sign in with Google button (uses Firebase Client SDK)
- Forgot password? link -> /password-reset
- Language selector (optional, defaults to browser locale)

### 5.2 Server Actions (+page.server.ts)
```typescript
// Email/password sign in
 action: 'signin' = async ({ request, cookies }) => {
   const formData = await request.formData();
   const email = formData.get('email');
   const password = formData.get('password');
   
   // 1. Verify with Firebase Admin SDK (signInWithEmailAndPassword via REST)
   // 2. Get Firebase UID
   // 3. Call resolveUser(uid) -> { userType, userData, claims }
   // 4. Check revoked status
   // 5. Create session cookie: createSessionCookie(idToken, userType)
   // 6. Set appropriate cookie (ADMIN_COOKIE or DRIVER_COOKIE)
   // 7. Redirect based on role:
   //    driver -> '/driver'
   //    admin/manager/moderator -> '/'
   //    revoked -> '/login?revoked=true'
 };
 
 // Google Sign-In (ID token from client)
 action: 'google' = async ({ request, cookies }) => {
   const formData = await request.formData();
   const idToken = formData.get('idToken'); // From Firebase Client SDK
   
   // 1. Verify ID token with Firebase Admin
   // 2. Get Firebase UID
   // 3. Call resolveUser(uid)
   // 4. Check revoked status
   // 5. Create & set session cookie
   // 6. Redirect based on role (same as above)
 };

// Password reset request
action: 'forgotPassword' = async ({ request }) => {
  const email = formData.get('email');
  await firebaseAuth().sendPasswordResetEmail(email);
  return { success: true };
};
```

---

## 6. Logout (src/routes/(auth)/logout/+page.server.ts)

**Single logout route** - clears both cookies:
```typescript
export const actions = {
  default: async ({ cookies }) => {
    cookies.delete('app.admin.session', { path: '/' });
    cookies.delete('app.driver.session', { path: '/' });
    redirect(302, '/login');
  }
};
```
- POST-only (CSRF safe)
- Redirects to /login with ?loggedOut=true for toast notification

---

## 7. Preferences Cookie

Single signed cookie for client-side preferences:

```typescript
// Cookie: app.prefs (signed, httpOnly: false so JS can read for SSR hydration)
interface PrefsCookie {
  locale: App.Locale;      // 'pl', 'en', etc.
  mode: 'light' | 'dark';  // theme
}

// Set on login (session.ts) and via settings page action
// Read in (driver)/+layout.ts and (admin)/+layout.ts for initial render
```

- Only `locale` and `mode` — nothing sensitive
- `httpOnly: false` so SvelteKit can read it during SSR for correct initial HTML
- Signed to prevent tampering
- Falls back to driver/admin document `preferredLanguage` and default `light` mode

---

## 8. Password Reset Flow

1. User clicks Forgot password? on /login
2. Redirected to /password-reset (in (auth) group)
3. Enters email -> POST to +page.server.ts
4. Server calls firebaseAuth().sendPasswordResetEmail(email)
5. User receives email with Firebase reset link
6. Firebase handles reset UI (hosted or custom)
7. After reset, user returns to /login

---

## 9. Google Sign-In Flow

### Client Side (+page.svelte)
```typescript
import { getAuth, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';

async function handleGoogleSignIn() {
  const provider = new GoogleAuthProvider();
  const result = await signInWithPopup(getAuth(), provider);
  const idToken = await result.user.getIdToken();
  
  // Send to server action
  const response = await fetch('/login', {
    method: 'POST',
    body: new FormData([['google', 'true'], ['idToken', idToken]])
  });
}
```

### Server Side (+page.server.ts)
```typescript
action: 'google' = async ({ request, cookies }) => {
  const formData = await request.formData();
  const idToken = formData.get('idToken');
  
  // Verify ID token
  const decoded = await firebaseAuth().verifyIdToken(idToken);
  
  // Resolve user type
  const { userType, userData, claims } = await resolveUser(decoded.uid);
  
  // Create session cookie
  const sessionCookie = await createSessionCookie(idToken, userType);
  cookies.set(userType === 'driver' ? DRIVER_COOKIE : ADMIN_COOKIE, sessionCookie, cookieOptions);
  
  // Redirect
  throw redirect(302, userType === 'driver' ? '/driver' : '/');
};
```

**Note:** Google Sign-In works for BOTH user types. If Firebase Auth user exists but no matching driver/admin record -> show Account not configured error.

---

## 10. Driver Data Requirements

### Firestore (vehicleDriver collection)
 Add to each driver document:
 ```typescript
 {
   firebaseUid: abc123,           // Required - set on driver creation
   preferredLanguage: en,         // Default: en (App.Locale)
   nationality: PL,               // ISO 3166-1 alpha-2
   status: 'active' | 'suspended' | 'revoked',  // NEW: revoked status
   // ... existing fields
 }
 ```
 
 ### On Driver Creation (addNewDriver in drivers.fdb.ts)
 1. Create Firebase Auth user (email/password)
 2. Get Firebase UID
 3. Save driver document with firebaseUid, status: 'active'
 4. Set custom claims: { role: 'driver', driverId: docId }
 5. Return temp password to admin
 
 ### On Driver Revoke
 1. Update driver document: status = 'revoked'
 2. Set Firebase custom claims: { role: 'revoked' } (immediate effect)
 3. Active session cookies will be rejected on next request (hooks check)

---

## 11. Paraglide i18n for Driver App

### Separate from Admin
- Admin: /messages/pl/ (existing)
- Driver: /messages/driver/{locale}.json (new)

### Supported Locales (9)
en (default), pl, uk, be, ru, ro, bg, uz, ka

### Driver Locale Resolution (in (driver)/+layout.ts)
```typescript
export const load = async ({ locals }) => {
  restrictDriver(locals);
  
  // Priority: driver.preferredLanguage -> browser Accept-Language -> en
  const locale = locals._driver.preferredLanguage || 'en';
  setLocale(locale);
  
  return { driver: locals._driver };
};
```

---

## 12. Migration Checklist

### Phase 1: Types & Core Auth
- [x] Update src/app.d.ts with new types (remove relics, add Locale, SessionClaims, Locals, AdminUser, Driver)
- [x] Create src/lib/server/auth/ module structure
- [x] Implement firebaseAdmin.ts, session.ts, userLookup.ts
- [x] Implement adminAuth.ts, driverAuth.ts

### Phase 2: Hooks & Route Restructure
  - [x] Create src/hooks.server.ts with central auth handler (revoked check, route groups)
  - [x] Restructure routes into (auth), (admin), (driver), (general), (api), (webhooks) groups
  - [x] Add +layout.ts to (admin) and (driver) with restrict functions
  - [x] Add +layout.ts to (general) with requireAuth
  - [x] Add +layout.ts to (api) and (webhooks) with NO auth middleware
  - [x] Move existing API routes to (api)/api
  - [x] Move existing webhook routes to (webhooks)/
 
### Phase 3: Login & Session
  - [x] Create (auth)/login/+page.svelte (single form)
  - [x] Create (auth)/login/+page.server.ts (signin, google, forgotPassword actions with revoked check)
  - [x] Create (auth)/password-reset/ pages
  - [x] Create (auth)/logout/+page.server.ts (single logout)
  - [x] Update cookie names to app.admin.session / app.driver.session

---
 
## 20. Phase 3 Implementation Notes (Completed)
 
### Files Created:
- `src/lib/firebase/client.ts` — Firebase Client SDK initialization (for Google Sign-In popup)
- `src/routes/(auth)/login/+page.svelte` — Single login form with email/password and Google Sign-In
- `src/routes/(auth)/login/+page.server.ts` — Server actions: `signin`, `google`, `forgotPassword`
- `src/routes/(auth)/password-reset/+page.svelte` — Password reset request page
- `src/routes/(auth)/password-reset/+page.server.ts` — Sends Firebase password reset email
- `src/routes/(auth)/logout/+page.server.ts` — Single logout clearing both session cookies
 
### Key Implementation Details:
1. **Firebase Client SDK** used on client for Google popup (`signInWithPopup`), sends ID token to server actions
2. **Server verifies ID token** via Firebase Admin SDK, calls `resolveUser(uid)` to determine user type (driver/admin) and check revoked status
3. **Session cookies** created via `setSessionAndPrefs()` with appropriate cookie (`app.admin.session` or `app.driver.session`)
4. **Redirects**: driver → `/driver`, admin → `/`, revoked → `/login?revoked=true`
5. **Logout** clears both cookies via POST action, redirects to `/login?loggedOut=true`
6. **Password reset** delegates to Firebase `generatePasswordResetLink()` — no custom reset UI
7. **Typecheck Status**: ✅ **0 errors, 0 warnings**
 
### Phase 4: Auth Helpers
  - [x] Create src/lib/server/auth/generalAuth.ts (requireAuth)
  - [x] Create src/lib/server/auth/apiAuth.ts (requireDriverApi, requireAdminApi, requireAnyApi, requirePublicApi)
  - [ ] Update src/lib/server/auth/adminAuth.ts (add requireManager, requireModerator)
  - [ ] Update src/lib/server/auth/userLookup.ts (revoked status check)
  - [ ] Update src/lib/server/auth/session.ts (include role in claims)
 
 ### Phase 5: Driver Integration
 - [ ] Add firebaseUid, preferredLanguage, nationality to Driver interface
 - [ ] Add status field (active/suspended/revoked) to Driver interface
 - [ ] Update addNewDriver to create Firebase Auth user + set custom claims
 - [ ] Update drivers.fdb.ts with new fields
 - [ ] Add revoke driver flow (update status + custom claims)
 
 ### Phase 6: i18n
 - [ ] Set up Paraglide for driver app (messages/driver/{locale}.json)
 - [ ] Add locale resolution in (driver)/+layout.ts
 - [ ] Default locale: en
 
 ### Phase 7: Testing & Cleanup
 - [ ] Test: driver cannot access admin routes
 - [ ] Test: admin cannot access driver routes
 - [ ] Test: driver A cannot access driver B data
 - [ ] Test: Google Sign-In for both types
 - [ ] Test: password reset flow
 - [ ] Test: session refresh (sliding expiry)
 - [ ] Test: logout clears both cookies
 - [ ] Test: revoked user redirected to login with ?revoked=true
 - [ ] Test: (general) routes accessible by both driver and admin
 - [ ] Test: (api) routes - per-handler auth works correctly
 - [ ] Test: (webhooks) routes work without session cookies
 - [ ] Test: admin role hierarchy (admin > manager > moderator)
 - [ ] Remove old src/lib/server/secure/auth.middleware.ts
 - [ ] Remove old rolePaths map and handleRoleCheck

---

## 13. Open Questions

1. Firebase Auth user creation: Should admin create driver accounts via Firebase Admin SDK (email/password), or should drivers self-register? Current addNewDriver creates password - keep this flow?

2. Driver status mapping: Map Driver.Status to Firebase custom claims? e.g., suspended/banned -> disable Firebase Auth account?

3. Admin user collection: Current user collection - does it have firebaseUid field? Need migration script.

4. Multi-language admin: Admin portal currently Polish-only. Add i18n later or now?

5. Session cookie domain: Single domain (cars.macropart.com) - confirmed?

6. Rate limiting: Add rate limiting to login actions (Firebase has built-in, but add app-level too)?

---

## 14. File List Summary
 
 ### New Files
 - src/app.d.ts (updated)
 - src/hooks.server.ts
 - src/lib/server/auth/index.ts
 - src/lib/server/auth/firebaseAdmin.ts
 - src/lib/server/auth/session.ts
 - src/lib/server/auth/userLookup.ts
 - src/lib/server/auth/adminAuth.ts
 - src/lib/server/auth/driverAuth.ts
 - src/lib/server/auth/generalAuth.ts
 - src/lib/server/auth/apiAuth.ts
 - src/lib/server/auth/types.ts
 - src/routes/(auth)/login/+page.svelte
 - src/routes/(auth)/login/+page.server.ts
 - src/routes/(auth)/password-reset/+page.svelte
 - src/routes/(auth)/password-reset/+page.server.ts
 - src/routes/(auth)/logout/+page.server.ts
 - src/routes/(admin)/+layout.ts
 - src/routes/(driver)/+layout.ts
 - src/routes/(general)/+layout.ts
 - src/routes/(api)/+layout.ts
 - src/routes/(webhooks)/+layout.ts
 - messages/driver/en.json (and 8 other locales)
 
 ### Modified Files
 - src/app.d.ts (complete rewrite of App namespace)
 - src/lib/server/db/firebase/drivers.fdb.ts (add firebaseUid, preferredLanguage, status)
 - src/routes/+layout.svelte (remove old auth logic if any)
 - Delete: src/lib/server/secure/auth.middleware.ts
 - Delete: src/lib/server/secure/access.ts (if unused)
 
 ### Route Restructure
 Move existing routes:
 - src/routes/* -> src/routes/(admin)/* (except login, api)
 - Create new src/routes/(driver)/* for driver PWA
 - Create new src/routes/(general)/* for shared authenticated routes
 - Create new src/routes/(api)/* with driver/admin/shared/public subfolders
 - Create new src/routes/(webhooks)/* for webhook endpoints

---

## 15. Estimated Effort
 
 | Phase | Files | Est. Time |
 |-------|-------|-----------|
 | 1. Types & Core Auth | 8 | 4-6h |
 | 2. Hooks & Route Restructure | 8 | 4-5h |
 | 3. Login & Session | 6 | 4-6h |
 | 4. Auth Helpers | 4 | 2-3h |
 | 5. Driver Integration | 3 | 2-3h |
 | 6. i18n Setup | 10 | 2-3h |
 | 7. Testing & Cleanup | - | 4-5h |
 | **Total** | **~39** | **22-31h** |

---

*Plan created based on codebase analysis and requirements discussion. Ready for implementation.*

---

## 16. Phase 1 Implementation Notes (Completed)

### Key Changes from Original Plan:

**1. Unified User Type** - Simplified from separate `AdminUser` and `Driver` interfaces in `Locals` to a single `User` interface:
- `App.locals._user` and `App.locals._driver` both typed as `User | null`
- `User` interface: `id`, `email`, `name`, `role`, `preferredLanguage`, `createdAt`, `updatedAt`
- Removed `firebaseUid` field from `User` - **driver ID = Firebase UID** (document ID in Firestore is the Firebase Auth UID)

**2. Driver Interface** - `Driver.Driver` now extends `App.User`:
```typescript
interface Driver extends NewDriverData, App.User {
  // ... all driver-specific fields (password, balance, earnings, etc.)
}
```

**3. Authentication via Firebase Auth Only**:
- No custom password storage/login logic in app
- `addNewDriver` creates Firebase Auth user first, gets UID, uses it as Firestore document ID
- Password only used at creation time for Firebase Auth, then discarded (only hashed version stored in Firestore for reference)
- All auth (email/password, Google, password reset) delegated to Firebase

**4. Removed Fields**:
- `firebaseUid` removed from `App.User`, `Driver.NewDriverData`, `cleanDriver`, Zod schema
- Driver collection uses Firebase UID as document ID (`id` field = Firebase UID)
- Admin user collection also uses Firebase UID as document ID

**5. userLookup.ts**:
- Queries drivers by `{ id: uid }` (not `firebaseUid`)
- Queries admin users by `{ id: uid }`
- Returns unified `User` type for both

**6. Typecheck Status**: ✅ Passing (0 errors)

### Files Created/Modified in Phase 1:
- `src/app.d.ts` - Updated App namespace types, removed firebaseUid, unified User
- `src/lib/server/auth/types.ts` - Unified User interface
- `src/lib/server/auth/firebaseAdmin.ts` - Firebase Admin SDK init
- `src/lib/server/auth/session.ts` - Session cookie management
- `src/lib/server/auth/userLookup.ts` - User resolution by UID
- `src/lib/server/auth/adminAuth.ts` - Admin authorization helpers
- `src/lib/server/auth/driverAuth.ts` - Driver authorization helpers
- `src/lib/server/auth/index.ts` - Module exports
- `src/lib/server/db/firebase/drivers.fdb.ts` - Creates Firebase Auth user, uses UID as doc ID
- `src/lib/server/db/firebase/users.fdb.ts` - Admin user collection
- `src/lib/assets/cleanItems.ts` - Removed firebaseUid
- `src/lib/assets/zodschemas/newdriver.zod.ts` - Removed firebaseUid from schema
- `src/routes/drivers/new/+page.svelte` - Removed firebaseUid from test data

---

## 17. Phase 1 Final Implementation Notes (Complete - Typecheck ✅)

### Final User Type Hierarchy (Updated from original plan):

**`App.UserBase`** - Base interface for both drivers and admins:
```typescript
interface UserBase {
	id: string;
	email: string;
	name: string;
	role: AdminRole | 'driver' | 'revoked';
	preferredLanguage: Locale;
	timestamp: number;      // renamed from createdAt
	updatedAt: number;
	lastLoggedIn: number;
}
```

**`App.User`** - Admin-only extended interface (drivers use UserBase via driver):
```typescript
interface User extends UserBase {
	role: AdminRole | 'revoked';  // restricted: no 'driver' role
	canSignHandovers: boolean;    // NEW: document signing permission
}
```

**`App.Locals`**:
```typescript
interface Locals {
	userType: UserType | null;
	user: User | null;           // Admin user (with canSignHandovers)
	driver: UserBase | null;     // Driver user (base fields only)
	sessionClaims: SessionClaims | null;
}
```

### Key Decisions:
1. **Driver ID = Firebase UID** - Document ID in Firestore is the Firebase Auth UID
2. **No firebaseUid field** - Removed from all types, driver/admin use `id` as Firebase UID
3. **Renamed `createdAt` → `timestamp`** - Consistent naming across UserBase
4. **Role restriction** - `User.role` only allows AdminRole | 'revoked' (no 'driver')
5. **New field `canSignHandovers`** - Boolean for admin document signing permission
6. **Driver extends UserBase** - `Driver.Driver extends NewDriverData, App.UserBase`
7. **Authentication 100% Firebase** - All auth (email/password, Google, password reset) delegated to Firebase
8. **Auth middleware** - Moved from hooks.server.ts to `src/lib/server/auth/auth.middleware.ts`

### Files Updated in This Refinement:
- `src/app.d.ts` - UserBase/User hierarchy, timestamp, canSignHandovers
- `src/lib/server/auth/types.ts` - Exported UserBase/User with canSignHandovers
- `src/lib/server/auth/session.ts` - Uses canSignHandovers, proper type casting
- `src/lib/server/auth/userLookup.ts` - Returns UserBase with all fields
- `src/lib/server/auth/adminAuth.ts` - Returns App.User
- `src/lib/server/auth/driverAuth.ts` - Returns UserBase
- `src/lib/server/auth/auth.middleware.ts` - Uses canSignHandovers
- `src/lib/server/db/firebase/drivers.fdb.ts` - Adds lastLoggedIn
- `src/routes/users/new/+page.svelte` - Uses canSignHandovers checkbox
- `src/routes/users/new/api/+server.ts` - Creates User with all fields
- `src/routes/users/[id]/+page.svelte` - Uses timestamp field
- `src/lib/assets/cleanItems.ts` - cleanUser with canSignHandovers
- `src/lib/assets/zodschemas/newuser.zod.ts` - Schema with canSignHandovers

### Typecheck Status: ✅ **0 errors, 0 warnings**

---

## 18. Phase 2 Implementation Notes (Completed)

### Route Structure Implemented:
```
src/routes/
├── (auth)/                    # Public routes (no auth)
│   ├── login/
│   ├── password-reset/
│   └── logout/
├── (driver)/                  # Driver routes (driver role only)
│   └── +layout.ts            # restrictDriver(locals)
├── (admin)/                   # Admin routes (moderator/manager/admin)
│   ├── +layout.svelte        # Main admin layout
│   ├── +page.svelte          # Admin dashboard
│   ├── drivers/
│   ├── vehicles/
│   ├── users/
│   ├── handovers/
│   ├── inspections/
│   ├── vehicletypes/
│   ├── panel/
│   ├── status/
│   ├── upload/
│   ├── translations/
│   └── camera/
├── (general)/                 # Any authenticated user
├── (api)/                     # API endpoints - PER-ROUTE AUTH
│   ├── +layout.ts            # No auth middleware
│   ├── api/                  # Existing API routes moved here
│   ├── driver/               # Driver-scoped (requireDriverApi)
│   ├── admin/                # Admin-scoped (requireAdminApi)
│   ├── shared/               # Both driver + admin (requireAnyApi)
│   └── public/               # No auth required (requirePublicApi)
└── (webhooks)/                # Webhook endpoints - NO SESSION AUTH
    ├── +layout.ts            # No auth - verify HMAC/signature
    ├── uber/
    ├── bolt/
    ├── telemetry/
    └── webhook/              # Existing webhook routes moved here
```

### New Auth Modules Created:
1. **`src/lib/server/auth/generalAuth.ts`** - `requireAuth(locals)` for (general) group
2. **`src/lib/server/auth/apiAuth.ts`** - Per-handler API auth:
   - `requireDriverApi(locals)` - driver-only endpoints
   - `requireAdminApi(locals, allowedRoles?)` - admin with role checks
   - `requireAnyApi(locals)` - accepts both driver and admin
   - `requirePublicApi(locals)` - no auth required

### Auth Middleware Updated:
- Added `CHECK_AUTH` flag from `$lib/nav/stores.svelte.ts` for testing
- When `CHECK_AUTH = false`, all auth checks are skipped
- Skips (api) and (webhooks) groups automatically (per-handler auth)

### Routes Moved:
- All existing admin routes → `(admin)/*`
- Existing `/api/*` → `(api)/api/*`
- Existing `/webhook/*` → `(webhooks)/webhook/*`
- Root `+layout.svelte` → `(admin)/+layout.svelte` (new root layout is minimal)
- Driver route already at `(driver)/driver/`

### Key Changes from Plan:
1. **Removed `+layout.ts` files** from route groups (no locales needed, causes type errors)
2. **Auth enforcement happens in middleware** (`auth.middleware.ts`) + per-route in (api) handlers
3. **(api) and (webhooks) groups skip middleware entirely** - handlers decide auth
4. **Phase 4 items (generalAuth.ts, apiAuth.ts) completed in Phase 2** - moved up for route structure

### Typecheck Status: ✅ **0 errors, 0 warnings**

---

## 19. Phase 3: Login & Session (Completed)
