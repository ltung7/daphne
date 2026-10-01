# MASTERPLAN: Fleet Management System - Project Plan & Checklist

> **Current Status**: SvelteKit + Firebase admin portal with vehicle/driver CRUD, inspections, handovers, DocuSign, role-based auth (admin/streamer/superadmin)
>
> **Priority Order**: 1) Backend/DB foundation → 2) Driver web app (PWA) → 3) Bolt Manual Processing → 4) Provisions/Finance
>
> **Documentation Conventions**:
> - Plans in `@docs/` are **pending / being implemented**
> - Plans in `@docs/archive/` are **already implemented**
> - **Collection preference**: Do not create standalone/baseless collections. Collections are implemented as part of their integration (e.g., `fuelTransactions` with fuel card integration, `boltSyncLog` with Bolt integration). Theoretical-only entities are avoided.
> - **Current focus**: Frontend and backend core (auth, data model, calculations, driver PWA) **without external integrations**. Integrations (Bolt APIs, Telematics, Fuel cards) require business setup with third-party entities and are cancelled agenda for now.
>
> ---
>
> ## 📋 Tracked Plans (Status & Priority)
>
> | Plan | Status | Priority | Description |
> |------|--------|----------|-------------|
> | [LOCALIZED_NOTIFICATION_PLAN.md](./LOCALIZED_NOTIFICATION_PLAN.md) | ⏳ Pending | High | Multi-channel notification architecture |
| [HEALTH_CHECK_PLAN.md](./HEALTH_CHECK_PLAN.md) | ⏳ Pending | Medium | Checkers and Resolvers architecture for system health |
> | [MONTHLY_COMPANY_LEDGER_PLAN.md](./MONTHLY_COMPANY_LEDGER_PLAN.md) | ⏳ Pending | High | Company ledger, driver settlements, cost allocation |
> | [JOB_SCHEDULING_PLAN.md](./JOB_SCHEDULING_PLAN.md) | ⏳ Pending | Medium | Consolidates all periodic/scheduled jobs |
> | [ADMIN_INCIDENT_UI_PLAN.md](./ADMIN_INCIDENT_UI_PLAN.md) | ✅ Implemented | Medium | Admin UI for managing system incidents |
> | [VEHICLE-STATUS-TRANSITION-PLAN-PART2.md](./VEHICLE-STATUS-TRANSITION-PLAN-PART2.md) | ⏳ Pending | Medium | Vehicle health check resolver and automation |
> | [AUTH_REWORK_PLAN.md](./archive/AUTH_REWORK_PLAN.md) | ✅ Implemented | Critical | Complete auth system rewrite |
> | [DRIVER-STATUS-TRANSITION-PLAN.md](./archive/DRIVER-STATUS-TRANSITION-PLAN.md) | ✅ Mostly Implemented | High | Driver lifecycle state machine |
> | [HANDOVER-RETURN-PLAN.md](./archive/HANDOVER-RETURN-PLAN.md) | ✅ Implemented | High | Handover assign/return flow and camera system |
> | [TESTING_PLAN.md](./archive/TESTING_PLAN.md) | ✅ Implemented | High | Testing infrastructure |
> | [VEHICLE-STATUS-TRANSITION-PLAN.md](./archive/VEHICLE-STATUS-TRANSITION-PLAN.md) | 🔄 Partially Implemented | Medium | Vehicle status state machine |
> | [LEDGER_SETTLEMENT_PLAN.md](./archive/LEDGER_SETTLEMENT_PLAN.md) | 📦 Archived | N/A | Superseded by MONTHLY_COMPANY_LEDGER_PLAN |
> | [FLEET_PROFIT_SETTLEMENT_PLAN.md](./archive/FLEET_PROFIT_SETTLEMENT_PLAN.md) | 📦 Archived | N/A | Superseded by MONTHLY_COMPANY_LEDGER_PLAN |
> | [EMAIL_NOTIFICATIONS_PLAN.md](./archive/EMAIL_NOTIFICATIONS_PLAN.md) | 📦 Archived | N/A | Superseded by LOCALIZED_NOTIFICATION_PLAN |
>
> ---
>
> ## Implemented from Archived Plans
>
> ### ✅ AUTH_REWORK_PLAN.md (Fully Implemented)
> **All phases complete** — 46 automated tests passing, typecheck clean, production build successful.
> 
> **Key Deliverables:**
> - **New auth types** (`src/app.d.ts`): Unified `User`/`UserBase` hierarchy, `AdminRole = moderator|manager|admin`, `SessionClaims` with `role: AdminRole | 'driver' | 'revoked'`, `Locals` with `userType`, `user` (admin), `driver` (driver), `sessionClaims`
> - **Auth module** (`src/lib/server/auth/`): `firebaseAdmin.ts`, `session.ts` (session cookies `app.admin.session`/`app.driver.session` + prefs cookie), `userLookup.ts` (resolves driver/admin by Firebase UID), `adminAuth.ts`, `driverAuth.ts`, `generalAuth.ts`, `apiAuth.ts` (per-handler: `requireDriverApi`, `requireAdminApi`, `requireAnyApi`, `requirePublicApi`), `types.ts`, `auth.middleware.ts`
> - **Route restructure**: 6 groups — `(auth)` public, `(driver)` driver-only, `(admin)` moderator/manager/admin, `(general)` any authenticated, `(api)` per-handler auth, `(webhooks)` signature verification only
> - **Single login** (`(auth)/login/`): Email/password + Google Sign-In, redirects by role (driver→`/driver`, admin→`/`)
> - **Password reset** (`(auth)/password-reset/`): Delegates to Firebase `sendPasswordResetEmail`
> - **Single logout** (`(auth)/logout/`): POST clears both cookies, redirects to `/login`
> - **Background session refresh**: Client timer in `(admin)`/`(driver)` layouts reads `exp` from sessionClaims, calls `/api/auth/refresh` 5min before expiry, gets fresh ID token from Firebase Client SDK, server verifies + checks revoked + issues new 2hr cookie
> - **Driver integration**: `driver.id` = Firebase UID (no `firebaseUid` field), `preferredLanguage`, `status: active|suspended|banned`, `addNewDriver` creates Firebase Auth user + sets custom claims `{ role: 'driver', driverId }`, revoke sets `status: 'banned'` + Firebase custom claim `role: 'revoked'` for immediate effect
> - **i18n**: Paraglide configured, 10 locales (`pl`, `en`, `uk`, `be`, `ro`, `uz`, `ka`, `ne`, `hi`, `tl`), locale resolution via `PARAGLIDE_LOCALE` cookie (driver `preferredLanguage`, admin always `pl`)
> - **Testing**: `vitest.config.ts`, mocks, 46 unit tests (adminAuth 21, driverAuth 12, apiAuth 13), 33 manual test scenarios documented, all `npm run check|test|build|lint` pass
>
> ### ✅ DRIVER-STATUS-TRANSITION-PLAN.md (Mostly Implemented)
> **Backend**: Status transition validation in `driver.service.ts`, rules enforced (e.g., `pending_verification` → `active` blocked)
> **Frontend**: `DriverVerification.svelte` progress, status transition dropdown in driver detail (valid next states only)
> **Remaining (not started):**
> - Audit log for status changes (`statusHistory` array on driver)
> - Scheduled job for document expiry monitoring → `documents_expired`
> - Webhook/notification for status changes
> - Handover document modal for `available`↔`active` transitions
> - Document expiry warnings in driver list/detail
> - Admin actions modal for suspend/ban/archive with reason field
> - Indexes for querying drivers by status
>
> ### ✅ TESTING_PLAN.md (Implemented via Auth Rework)
> **Automated**: `vitest.config.ts`, global mocks (Firebase Admin, Firestore), `src/lib/test/helpers/locals.ts`, 46 tests passing
> **Manual**: 33 scenarios (M-01 to M-33) covering route access, login/session, logout/reset, API auth, webhooks, general routes, i18n, revocation
> **CI**: Runs `check`, `lint`, `test`, `build` on every PR
> **Coverage targets**: Auth module 95%, middleware 90%, API auth 90%, services 85%, route handlers 80%
>
> ### 🔄 VEHICLE-STATUS-TRANSITION-PLAN.md (Partially Implemented)
> **Defined**: 7 statuses (`precheck` initial, `available`, `assigned`, `under_maintenance`, `broken`, `unmovable`, `retired`), transition matrix, triggers, business rules
> **Gaps (not implemented):**
> - No explicit transition validation server-side (status can be set to any value via `updateVehicle()`)
> - No audit trail for status changes (only assignment changes create records in `vehicleAssignment`)
> - No automated transitions (e.g., insurance expiry doesn't auto-move to `under_maintenance`)
> - No transition permissions (role-based)
> **Existing endpoints**: `PATCH /api/vehicles/:id/status` (manual), `POST /api/vehicles/assign` (via handover), `POST /api/vehicles/return` (via return handover)
>
> ---

---

## 1. BACKEND & DATABASE FOUNDATION (Priority 1)

### 1.1 Data Model Extensions

#### Vehicles Collection (`vehicles`)
- [ ] Add `leaseInfo` subcollection:
  - `monthlyPayment` (grosze), `leaseEndDate`, `lessor`, `contractNumber`, `buyoutValue`
  - `insuranceCosts`: OC, AC, NNW, GAP per period
- [ ] Add `fuelCard` reference: `cardId`, `provider` (Orlen, BP, Shell, Circle K), `limitMonthly`, `pinHash`
- [ ] Add `telemetryDevice`: `deviceId`, `provider` (GeoTab, Webfleet, FleetComplete, etc.), `installDate`, `status`
- [ ] Add `platformStatus` per provider: `bolt` → `pending` | `approved` | `rejected` | `suspended` | `not_applicable`
- [x] Add `assignedDriverHistory`: array of `{driverId, startDate, endDate, handoverId}` (Note: Implemented via `vehicleAssignment` collection instead of array)

#### Drivers Collection (`drivers`)
- [x] Add `firebaseUid`: string — links to Firebase Auth (required) (Note: implemented by using Firebase UID directly as `driver.id`)
- [x] Add `status`: `active` | `suspended` | `revoked` — for auth revocation
- [ ] Add `documentsExpiring`: computed view for license, medical, psych, taxi auth, criminal record
- [x] Add `preferredLanguage`: locale code (pl/en/uk/be/ru/ro/bg/uz/ka) for i18n

#### New Collections
- [ ] `boltSyncLog` - Audit trail for Bolt API operations
  - `operation`: `register_driver` | `switch_driver` | `assign_vehicle` | `upload_document` | `fetch_earnings`
  - `requestPayload`, `responsePayload`, `status`, `error`, `retryCount`, `driverId`, `vehicleId`
- [ ] `telemetryEvents` - Raw telemetry ingestion (partitioned by date)
  - `deviceId`, `vehicleId`, `timestamp`, `lat`, `lng`, `speed`, `ignition`, `fuelLevel`, `odometer`, `harshEvents`
  - TTL: 90 days raw, aggregated daily kept indefinitely
- [ ] `dailyReports` - Driver end-of-shift reports
  - `driverId`, `vehicleId`, `date`, `startOdometer`, `endOdometer`, `startFuel`, `endFuel`
  - `tripsCount`, `issues`, `photos[]`, `submittedAt`
  - `status`: `submitted` | `reviewed` | `disputed`
- [ ] `fuelTransactions` - Fuel card transactions (imported from provider CSV/API)
  - `cardId`, `vehicleId`, `driverId`, `date`, `station`, `liters`, `amountGross`, `amountNet`, `vat`
  - `matched`: boolean (to daily report / vehicle)
- [x] `incidents` (Replaces `alerts`) - System incidents & warnings via Notification Engine
  - See `ADMIN_INCIDENT_UI_PLAN.md` and `LOCALIZED_NOTIFICATION_PLAN.md`
  - `category`, `severity`, `status`, `source`, `metadata` (entity IDs)
- [ ] `userNotifications` - In-App notifications for drivers and admins (shares UI and Firebase auth IDs)
- [ ] `reports` - Generated reports (PDF/Excel)
  - `type`: `monthly_settlement` | `fleet_profitability` | `driver_performance` | `vehicle_utilization` | `fuel_efficiency` | `compliance_audit`
  - `period`, `filters`, `fileUrl`, `generatedAt`, `generatedBy`

### 1.2 Firebase Security Rules (`firestore.rules`)
> **Note**: Explicit firebase rules are created as needed during feature implementation rather than planned upfront.

### 1.3 Indexes & Performance
- [x] Composite indexes for: `driverBalanceEvents` (driverId + timestamp DESC), `driverBalanceEvents` (driverId + status + timestamp DESC)
- [ ] Composite indexes for: `dailyReports` (driverId + date), `telemetryEvents` (vehicleId + timestamp), `fuelTransactions` (cardId + date), `alerts` (entityType + entityId + severity)
- [ ] BigQuery export schema for analytics ONLY (trips, settlements, fuel, telemetry aggregates) — **not for real-time page loads** (per MONTHLY_COMPANY_LEDGER_PLAN.md)
- [ ] BigQuery `job_logs` table — Flat logging schema for all cron executions (per JOB_SCHEDULING_PLAN.md)

### 1.4 Auth System (References AUTH_REWORK_PLAN.md)
> **Complete rewrite** — see `AUTH_REWORK_PLAN.md` for full design. Summary:
- Firebase Authentication as identity provider
- Separate session cookies: `app.admin.session` (admin/manager/moderator) and `app.driver.session` (driver)
- Single login page `/login` (email/password + Google Sign-In) for both user types
- Route groups: `(auth)`, `(driver)`, `(admin)`, `(general)`, `(api)`, `(webhooks)`
- Admin roles: `moderator` | `manager` | `admin` (hierarchy: admin > manager > moderator)
- Revoked handling: Firestore `status: 'revoked'` + Firebase custom claim `role: 'revoked'`
- Sliding session refresh (2hr), per-handler auth for API routes

---

## 2. DRIVER WEB APP (PWA) - Priority 2

### 2.1 Architecture Decision: Same Repo (Recommended)
> The application uses a single SvelteKit codebase (UI and backend logic together). Route groups include `(auth)`, `(driver)`, `(admin)`, `(general)`, `(api)`, and `(webhooks)`. Shared components are in `lib/components` and server logic in `lib/server`.

### 2.2 Driver Auth (Per AUTH_REWORK_PLAN.md)
- Firebase Auth: Custom claims `role: 'driver'`, `driverId`
- Session cookie: `app.driver.session` (2hr sliding, httpOnly, secure)
- Login: Single `/login` page (shared with admin), redirects to `/driver` after auth
- Middleware: `restrictDriver` in `(driver)/+layout.ts`
- Passwordless option: SMS OTP (Twilio/Firebase Auth) for driver convenience
- Revoked handling: Check `driver.status === 'revoked'` + Firebase custom claim

### 2.3 Driver PWA Features
- [ ] **Dashboard**: Current vehicle, today's earnings estimate, pending settlement, alerts
- [ ] **Daily Report**: Odometer, fuel, trips, photos, issues → submit
- [ ] **Settlements**: History with line-item breakdown (gross → net), download PDF
- [ ] **Documents**: View/upload expiring docs (license, medical, psych, taxi auth), DocuSign signing
- [ ] **Vehicle Info**: Assigned vehicle details, inspection checklist, fuel card PIN
- [ ] **Profile**: Personal info, bank details, tax info, notification preferences
- [ ] **Push Notifications**: Settlement ready, document expiring, inspection due, Bolt status change
- [ ] **Offline Support**: Cache daily report form, queue submission when online

### 2.4 PWA Configuration
- [ ] `vite-plugin-pwa` with Workbox
- [ ] Manifest: name, icons, theme_color, display: standalone
- [ ] Service worker: cache static assets, API responses (stale-while-revalidate)
- [ ] Install prompt, update notification

### 2.5 Driver App Internationalization (Paraglide JS)
> See `AUTH_REWORK_PLAN.md` Section 11 for complete setup.
- **Message catalog structure**: `/messages/driver/{locale}.json` (separate from admin `/messages/pl/`)
- **Supported locales**: `pl` (Polish), `en` (English), `uk` (Ukrainian), `be` (Belarusian), `ru` (Russian), `ro` (Romanian), `bg` (Bulgarian), `uz` (Uzbek), `ka` (Georgian) — based on common driver nationalities in PL
- **Default locale**: `pl` (Polish) — fallback for legal/official terms
- **Locale detection priority**: 1) Driver profile `preferredLanguage` → 2) Browser `Accept-Language` → 3) `pl`
- **Persist locale**: Store in driver profile + localStorage for instant reload
- **Runtime locale switching**: No page reload, instant UI update via `$i18n` runes
- **Message extraction**: Use `paraglide-js` CLI to extract from `.svelte` files (`m.*` calls)
- **Translation workflow**: 
  - Source messages in English (developer-facing keys)
  - Professional translation for PL, UK, BE, RU, RO, BG, UZ, KA
  - Machine translation (Gemini/OpenRouter) for initial drafts, human review for legal/safety text
- **Critical translated surfaces**: Daily report form, settlement breakdown, document upload, safety alerts, vehicle inspection checklist, handover documents, push notifications, error messages
- **Legal document language**: Handover/inspection PDFs generated in driver's preferred language (already have multi-lang templates in `src/lib/documents/`)
- **Date/number formatting**: Use `@inlang/paraglide-js` formatters or `Intl` with driver locale for currency (PLN), dates, numbers
- **Right-to-left**: Not needed for target locales (all LTR)
- **Pluralization**: Use Paraglide's plural syntax for trip counts, days, etc.
- **Accessibility**: `lang` attribute on `<html>` updates with locale, screen reader announcements in correct language

---

## 3. BOLT INTEGRATION - Priority 3 (Manual First)
> **Note on Automation:** Per `MONTHLY_COMPANY_LEDGER_PLAN.md`, automated API sync (Bolt direct clients, webhook endpoints, orchestration) is **CANCELLED AGENDA** for now. The system relies entirely on a bottom-up manual entry and CSV batch upload workflow as the primary failsafe mechanism.
> **Note on Providers:** At this stage, ONLY the Bolt platform integration is being implemented. Other platforms (Uber, FreeNow, iTaxi) are removed from current scope.

### 3.1 Sheet Fallback / Manual Import (Active Agenda)
- [ ] Parse Bolt CSV/Excel exports (earnings, payouts, driver/vehicle status)
- [ ] Column mapping config per export type
- [ ] Validation: required fields, data types, cross-ref with DB
- [ ] Import UI: Admin upload → preview → confirm → process (Batch driver matching)
- [ ] Deduplication: Match by Bolt internal IDs (driverId, vehicleId, tripId)

### 3.2 Automated API Sync & Orchestration (Cancelled Agenda)
- [ ] `BoltClient` class, OAuth2, rate limiting
- [ ] Webhook handlers (`POST /api/webhooks/bolt`)
- [ ] Sync Orchestration (`syncDrivers`, `syncVehicles`, `syncEarnings`)

---

## 4. TELEMATICS INTEGRATION
> **Note:** Per `MONTHLY_COMPANY_LEDGER_PLAN.md`, automated fuel card and telemetry API syncs are **CANCELLED AGENDA**. Fuel anomalies and mileage are processed via manual reporting or CSV batch uploads.

### 4.1 Provider Abstraction & Ingestion (Cancelled Agenda)
- [ ] `TelemetryProvider` interface, Webhooks, Scheduled pull
- [ ] Derived Metrics (`dailyVehicleStats`, `driverBehaviorScore`)

---

## 5. PROVISIONS & FINANCE - Priority 4

> **Implementation:** See `LEDGER_SETTLEMENT_PLAN.md` and `MONTHLY_COMPANY_LEDGER_PLAN.md` for complete design — append-only driver balance ledger (`driverBalanceEvents` collection) with idempotent event writes, running balance per event, verification. This section covers fleet-level reporting views over ledger data.

### 5.1 Fleet-Level Reporting (Read-Only Views)
- [ ] **Monthly P&L per vehicle**: Revenue (from ledger income events) - Lease - Insurance - Fuel - Maintenance - Fines - Provision (from ledger settlement events) = Net
- [ ] **Fleet aggregate**: Total revenue, total costs, fleet margin
- [ ] **Driver P&L**: Net payout (ledger) vs provision collected (ledger)
- [ ] Export: Excel with pivot tables, PDF summary

### 5.2 Cost Collection (Operational, Feeds Ledger)
- [ ] **Fuel card management**: Import transactions → match to vehicle/driver → validate → create `repayments` ledger events
- [ ] **Maintenance/Insurance/Fines**: Admin-approved cost items → create ledger events (type TBD per `LEDGER_SETTLEMENT_PLAN.md`)

### 5.3 Reconciliation Reports
- [ ] **Income Event Reconciliation**: Bolt weekly sheet vs `income_bolt_weekly` ledger events
- [ ] **Cost Analysis**: Maintenance by type, insurance claims, fines

---

## 6. DOCUMENTATION & LEGAL

### 6.1 Driver Documents (Required for Polish Market)
| Document | Expiry Tracking | Legal Basis |
|----------|----------------|-------------|
| Prawo jazdy (driving license) | Yes (10-15 yrs) | Prawo o kierowcach |
| Dowód osobisty / Karta pobytu | Yes (10 yrs / varies) | Ustawa o dokumentach paszportowych |
| Świadectwo o braku skazania (KRK) | Yes (6 months) | Prawo o przychodach do komunikacji |
| Świadectwo lekarskie | Yes (1-5 yrs by age) | Rozporządzenie w sprawie badań kierowców |
| Świadectwo psychologiczne | Yes (5 yrs) | As above |
| Decyzja taksówkowa (taxi ID) | Yes (varies by city) | Prawo o transporcie drogowym |
| Umowa o pracę / B2B / Zlecenie | Contract end | Kodeks pracy / Kodeks cywilny |
| Zgoda RODO / Przetwarzanie danych | On signup | RODO (GDPR) |
| Umowa o wersji pojazdu (handover) | Per assignment | Kodeks cywilny |

### 6.2 Vehicle Documents
| Document | Expiry Tracking |
|----------|----------------|
| Dowód rejestracyjny | N/A |
| Polisa OC | Yes (1 yr) |
| Polisa AC/NWW/GAP | Yes (1 yr) |
| Badanie techniczne | Yes (1 yr) |
| Legalamizacja taksometru | Yes (2 yrs) |
| Certyfikat telemetrii | Install only |
| Umowa leasingu | Lease end |
| Zdjęcia pojazdu (4 strony + wnętrze) | On handover |

### 6.3 Document Workflow (DocuSign Integration - Already Started)
- [x] Templates: Handover (assign/return/unilateral), Inspection (daily/monthly), Driver contract, NDA, GDPR consent
- [ ] Auto-send on: New driver, vehicle assignment, document expiring (30/14/7 days)
- [ ] Signed PDF → Store in Firebase Storage, link in `driverDocuments`/`vehicleDocuments`
- [ ] Expiry alerts: Create `alert` records, show in admin & driver dashboards

---

## 7. ALERTS, WARNINGS, REPORTS

### 7.1 Health Checks, Incidents & Notifications (Replaces Alert Engine)
> **Architecture**: Split into scheduled **Health Checks** (Checkers & Resolvers) and a unified **Multi-Channel Notification System** (which auto-logs incidents). See `HEALTH_CHECK_PLAN.md`, `JOB_SCHEDULING_PLAN.md`, and `LOCALIZED_NOTIFICATION_PLAN.md`.
- [x] **Core Notification Engine**: `sendNotification` with Email, Push, and In-App routing + automatic Incident logging.
- [x] **Core Health Check Engine**: `src/lib/server/services/health/healthCheck.service.ts` with Checker/Resolver pattern.
- [x] **Driver/Vehicle Document Checkers/Resolvers**: Auto-transition logic and document expiry notifications implemented.
- [x] **Incident Matrix**: Admin distribution list for specific system events (`/incidents/matrix`).
- [x] **Admin Incident UI**: View, filter, and resolve incidents (per `ADMIN_INCIDENT_UI_PLAN.md`).
- [ ] **Job Scheduler**: Single dynamic API route pattern (`/api/jobs/[job]/+server.ts`) for cron executions logged to BigQuery (per `JOB_SCHEDULING_PLAN.md`).
- [ ] **Future Checkers/Resolvers**: Bolt sync failures, telemetry offline, fuel/provision anomalies, missing daily reports.

### 7.2 Key Reports (Admin)
- [x] **Driver Balance Ledger / Current Balances**: All drivers, current balance, status, totals
- [ ] **Fleet Profitability**: Per vehicle, per driver, aggregate
- [ ] **Driver Performance**: Trips, earnings, rating, safety score, provision rate
- [ ] **Vehicle Utilization**: Active days, km, revenue/km, cost/km, downtime
- [ ] **Fuel Efficiency**: L/100km per vehicle, per driver, vs benchmark
- [ ] **Compliance Audit**: Document expiry matrix (driver × document type)
- [ ] **Income Event Reconciliation**: Bolt weekly sheet vs `income_bolt_weekly` ledger events
- [ ] **Cost Analysis**: Maintenance by type, insurance claims, fines

### 7.3 Driver-Facing Reports
- [ ] Monthly settlement statement (PDF)
- [ ] Year-to-date earnings summary
- [ ] Tax document (PIT-11 data / B2B invoice summary)

---

## 8. EXISTING CODEBASE INTEGRATION NOTES

### 8.1 Already Implemented (Leverage)
- ✅ Firebase Auth + JWT middleware (`auth.middleware.ts`)
- ✅ Role-based route protection (`rolePaths` map)
- ✅ Vehicle CRUD + status + inspections + handovers
- ✅ Driver CRUD + documents + status tracking
- ✅ DocuSign integration (templates, webhooks, signing)
- ✅ Multi-language handover/inspection documents (PL/EN/UK/BE/CS/NE)
- ✅ Vehicle types with platform configs (UberX, Comfort, XL, etc.)
- ✅ File upload (temp + signed URLs)
- ✅ Translation service (Gemini + OpenRouter)

### 8.2 Needs Extension
- ✅ **Auth system rewrite**: Firebase Auth + session cookies, 6 route groups, revoked handling, per-handler API auth (see `AUTH_REWORK_PLAN.md`)
- 🔄 DB: New collections (driverBalanceEvents ✅, dailyReports, fuelTransactions, alerts, telemetryEvents, boltSyncLog)
- ✅ API: `(api)/driver`, `(api)/admin`, `(api)/shared`, `(api)/public` with per-handler auth
- 🔄 UI: Driver PWA layout + routes under `(driver)/`
- 🔄 Calculations: Driver balance ledger per `LEDGER_SETTLEMENT_PLAN.md`
- 🔄 Sync: Bolt client, telemetry providers, sheet importers
- ✅ i18n: Add Paraglide for driver app (separate from admin i18n)

### 8.3 Tech Debt / Cleanup
- [ ] Migrate `src/lib/server/db/firebase/*.fdb.ts` to typed repositories
- [ ] Add Zod schemas for all API inputs (already have zod dep)
- [ ] Unit tests for calculation engine (vitest)
- [ ] E2E tests for critical flows (Playwright via vitest-browser)
- [ ] OpenAPI spec for `/api/driver/*` and `/api/admin/*`

---

## 9. IMPLEMENTATION SEQUENCE

### Phase 1: Backend Foundation (2-3 weeks)
0. **Auth system rewrite** (1 week) — per `AUTH_REWORK_PLAN.md` (✅ Done):
   - [x] Types: `AdminRole = moderator|manager|admin`, `SessionClaims.role` includes `revoked`
   - [x] Create `src/lib/server/auth/` module (firebaseAdmin, session, userLookup, adminAuth, driverAuth, generalAuth, apiAuth)
   - [x] Create `src/hooks.server.ts` with 6 route groups, revoked check, sliding refresh
   - [x] Route restructure: (auth), (driver), (admin), (general), (api), (webhooks)
   - [x] Single `/login` page, Google Sign-In, password reset, logout
   - [x] Test: revoked flow, role hierarchy, per-handler API auth
1. [x] Extend Firestore schemas & security rules (including `driverBalanceEvents` rules)
2. [x] Create new collections with indexes (including `driverBalanceEvents` composite indexes)
3. [ ] Build calculation engine (pure TS, heavily tested)
4. [x] Implement driver balance ledger per `LEDGER_SETTLEMENT_PLAN.md` (events, running balance, verification)
5. [x] Health check engine + multi-channel localized notifications (alerts superseded by incidents)

### Phase 2: Driver PWA (2-3 weeks)
1. [x] Driver auth (Firebase custom claims + middleware per AUTH_REWORK_PLAN.md)
2. Driver layout + routes under `(driver)/` (mobile-first, PWA)
3. [x] **Paraglide i18n setup**: Install packages, configure `project.inlang.json`, create message catalogs for 9 locales
4. Daily report form (offline-capable, fully translated)
5. Settlement view + PDF download (localized, reads from ledger)
6. Document center (view/upload/sign, multi-lang)
7. Push notifications (FCM, localized)
8. Language selector in profile, persist to driver record

### Phase 3: Bolt Integration (Manual First) (3-4 weeks)
1. Sheet fallback importer UI and Logic
2. Parse Bolt CSV/Excel exports (Earnings, Deductions)
3. CSV Deduplication & Validation framework

### Phase 4: Fleet Reporting (1-2 weeks)
1. Fuel card import + matching + anomalies
2. Fleet P&L reports
3. Compliance audit report
4. Automated monthly report generation

### Phase 5: Polish & Harden (Ongoing)
- Load testing, monitoring, error tracking (Sentry)
- GDPR audit, data retention policies
- Backup/restore procedures
- Documentation & runbooks

---

## 10. OPEN QUESTIONS FOR TEAM

1. **Lease accounting**: Are lease costs borne by fleet or passed to driver? (Affects provision calc)
2. **Fuel policy**: Driver pays all fuel, or fleet pays up to limit? (Affects cost deduction)
3. **Insurance claims**: Who handles - fleet admin or driver? Cost allocation?
4. **Bolt fleet ID**: Do you have fleet ID and API credentials already?
5. **Telematics provider**: Which hardware/platform? (Determines integration effort)
6. **Payment rails**: How are driver payouts made? (Bank transfer, Blik)
7. **VAT invoicing**: Drivers B2B (issue invoice) or employment contract? (Affects settlement doc)
8. **Translation budget**: Professional translation for 8 non-Polish locales (~2000 strings) — use agency or in-house?
9. **Driver onboarding language**: Should signup flow be fully translated from day 1, or start with PL/EN/UK?

---

## 11. ESTIMATED TIMELINE

| Phase | Duration | Key Deliverable |
|-------|----------|-----------------|
| 1. Backend Foundation | 2-3 weeks | Ledger, calculations, alerts working |
| 2. Driver PWA | 2-3 weeks | Driver can submit reports, view settlements |
| 3. Bolt Sync | 3-4 weeks | Sheet Fallback / CSV Parsers |
| 4. Fleet Reporting | 1-2 weeks | P&L, reconciliation reports |
| **Total** | **8-12 weeks** | **Production-ready fleet platform** |

---

*Generated from codebase analysis and requirements discussion. Update as priorities shift.*