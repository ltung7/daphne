# Fleet Management System - Project Plan & Checklist

> **Current Status**: SvelteKit + Firebase admin portal with vehicle/driver CRUD, inspections, handovers, DocuSign, role-based auth (admin/streamer/superadmin)
>
> **Priority Order**: 1) Backend/DB foundation → 2) Driver web app (PWA) → 3) Bolt API + Telematics → 4) Provisions/Finance

---

## 1. BACKEND & DATABASE FOUNDATION (Priority 1)

### 1.1 Data Model Extensions

#### Vehicles Collection (`vehicles`)
- [ ] Add `leaseInfo` subcollection:
  - `monthlyPayment` (grosze), `leaseEndDate`, `lessor`, `contractNumber`, `buyoutValue`
  - `insuranceCosts`: OC, AC, NNW, GAP per period
- [ ] Add `fuelCard` reference: `cardId`, `provider` (Orlen, BP, Shell, Circle K), `limitMonthly`, `pinHash`
- [ ] Add `telemetryDevice`: `deviceId`, `provider` (GeoTab, Webfleet, FleetComplete, etc.), `installDate`, `status`
- [ ] Add `platformStatus` per provider: `bolt`, `uber`, `freenow`, `itaxi` → `pending` | `approved` | `rejected` | `suspended` | `not_applicable`
- [ ] Add `assignedDriverHistory`: array of `{driverId, startDate, endDate, handoverId}`

#### Drivers Collection (`drivers`)
- [ ] Add `firebaseUid`: string — links to Firebase Auth (required)
- [ ] Add `status`: `active` | `suspended` | `revoked` — for auth revocation
- [ ] Add `bankDetails`: `accountNumber` (IBAN), `accountHolder`, `bankName`, `swift`
- [ ] Add `taxInfo`: `taxId` (NIP), `taxOffice`, `isVatPayer`, `vatRate`
- [ ] Add `cashCollections`: array of `{date, amount, rideIds[], status: pending|deposited|disputed}` — operational tracking
- [ ] Add `documentsExpiring`: computed view for license, medical, psych, taxi auth, criminal record
- [ ] Add `preferredLanguage`: locale code (pl/en/uk/be/ru/ro/bg/uz/ka) for i18n

#### New Collections
- [ ] `boltSyncLog` - Audit trail for Bolt API operations
  - `operation`: `register_driver` | `switch_driver` | `assign_vehicle` | `upload_document` | `fetch_earnings`
  - `requestPayload`, `responsePayload`, `status`, `error`, `retryCount`, `driverId`, `vehicleId`
- [ ] `telemetryEvents` - Raw telemetry ingestion (partitioned by date)
  - `deviceId`, `vehicleId`, `timestamp`, `lat`, `lng`, `speed`, `ignition`, `fuelLevel`, `odometer`, `harshEvents`
  - TTL: 90 days raw, aggregated daily kept indefinitely
- [ ] `dailyReports` - Driver end-of-shift reports
  - `driverId`, `vehicleId`, `date`, `startOdometer`, `endOdometer`, `startFuel`, `endFuel`
  - `tripsCount`, `cashCollected`, `cardCollected`, `issues`, `photos[]`, `submittedAt`
  - `status`: `submitted` | `reviewed` | `disputed`
- [ ] `fuelTransactions` - Fuel card transactions (imported from provider CSV/API)
  - `cardId`, `vehicleId`, `driverId`, `date`, `station`, `liters`, `amountGross`, `amountNet`, `vat`
  - `matched`: boolean (to daily report / vehicle)
- [ ] `alerts` - System alerts/warnings
  - `type`: `document_expiring` | `inspection_overdue` | `provision_anomaly` | `fuel_anomaly` | `telemetry_offline` | `bolt_sync_failed` | `settlement_ready`
  - `severity`: `info` | `warning` | `critical`
  - `entityType`: `driver` | `vehicle` | `settlement` | `system`
  - `entityId`, `message`, `acknowledged`, `acknowledgedBy`, `acknowledgedAt`, `resolvedAt`
- [ ] `reports` - Generated reports (PDF/Excel)
  - `type`: `monthly_settlement` | `fleet_profitability` | `driver_performance` | `vehicle_utilization` | `fuel_efficiency` | `compliance_audit`
  - `period`, `filters`, `fileUrl`, `generatedAt`, `generatedBy`

### 1.2 Firebase Security Rules (`firestore.rules`)
- [ ] Admin/staff: Full read/write on all collections per account scope
- [ ] Driver (separate auth): Read own driver record, own settlements, own daily reports (write), own documents
- [ ] Driver: Write own daily reports, read assigned vehicle info
- [ ] Service account (backend): Full write for sync jobs, calculations, webhooks
- [ ] Enforce: `account` field matching on all queries (multi-tenant isolation)

### 1.3 Indexes & Performance
- [ ] Composite indexes for: `driverBalanceEvents` (driverId + timestamp DESC), `driverBalanceEvents` (driverId + status + timestamp DESC), `dailyReports` (driverId + date), `telemetryEvents` (vehicleId + timestamp), `fuelTransactions` (cardId + date), `alerts` (entityType + entityId + severity)
- [ ] BigQuery export schema for analytics ONLY (trips, settlements, fuel, telemetry aggregates) — **not for real-time page loads** (per LEDGER_SETTLEMENT_PLAN.md)

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
```
src/
  routes/
    (auth)/                    # Public routes (no auth required)
      +layout.ts              # No auth check
      login/
        +page.svelte          # Single login form (email/password + Google)
        +page.server.ts       # Login action, password reset action
      password-reset/
      logout/
    (driver)/                  # New driver PWA routes
      +layout.svelte          # Driver-specific layout (no sidebar, mobile-first)
      dashboard/+page.svelte
      reports/+page.svelte
      settlements/+page.svelte
      documents/+page.svelte
      vehicle/+page.svelte
      profile/+page.svelte
    (admin)/                   # Admin portal (moderator/manager/admin)
      +layout.ts              # restrictAdmin(locals)
      +page.svelte
      drivers/
      vehicles/
      finance/
      integrations/
    (general)/                 # Any authenticated user (driver OR admin)
      +layout.ts              # requireAuth(locals)
      profile/
      notifications/
    (api)/                     # API endpoints - PER-ROUTE AUTH
      +layout.ts              # No auth middleware - handlers decide
      driver/                 # requireDriverApi in handler
      admin/                  # requireAdminApi in handler
      shared/                 # requireAnyApi in handler
      public/                 # requirePublicApi in handler
    (webhooks)/                # Webhook endpoints - NO SESSION AUTH
      +layout.ts              # No auth - verify signature per handler
      uber/
      bolt/
      telemetry/
  lib/
    components/       # Shared components (DriverStatus, VehicleStatus, etc.)
    server/
      auth/           # Firebase auth module (see AUTH_REWORK_PLAN.md)
```

### 2.2 Driver Auth (Per AUTH_REWORK_PLAN.md)
- Firebase Auth: Custom claims `role: 'driver'`, `driverId`, `accountId`
- Session cookie: `app.driver.session` (2hr sliding, httpOnly, secure)
- Login: Single `/login` page (shared with admin), redirects to `/driver` after auth
- Middleware: `restrictDriver` in `(driver)/+layout.ts`
- Passwordless option: SMS OTP (Twilio/Firebase Auth) for driver convenience
- Revoked handling: Check `driver.status === 'revoked'` + Firebase custom claim

### 2.3 Driver PWA Features
- [ ] **Dashboard**: Current vehicle, today's earnings estimate, pending settlement, alerts
- [ ] **Daily Report**: Odometer, fuel, trips, cash, photos, issues → submit
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

## 3. BOLT INTEGRATION - Priority 3 (After Provider Registration)

### 3.1 Bolt Fleet API Client (`src/lib/server/bolt/`)
- [ ] `BoltClient` class: auth (OAuth2 client credentials), rate limiting, retries, idempotency keys
- [ ] Endpoints needed:
  - `POST /fleets/{fleetId}/drivers` - Register driver
  - `PATCH /fleets/{fleetId}/drivers/{driverId}` - Update driver (switch vehicle, status)
  - `POST /fleets/{fleetId}/vehicles` - Register vehicle
  - `PATCH /fleets/{fleetId}/vehicles/{vehicleId}` - Update vehicle assignment
  - `POST /fleets/{fleetId}/documents` - Upload driver/vehicle documents
  - `GET /fleets/{fleetId}/earnings` - Fetch earnings/settlement data
  - `GET /fleets/{fleetId}/payouts` - Fetch payout details
- [ ] Webhook handler: `POST /api/webhooks/bolt` - Verify signature, process events
  - Events: `driver.approved`, `driver.rejected`, `vehicle.approved`, `payout.completed`, `document.requested`

### 3.2 Sync Orchestration (`src/lib/server/sync/boltSync.service.ts`)
- [ ] `syncDrivers()` - Push new/updated drivers to Bolt, pull status
- [ ] `syncVehicles()` - Push vehicles, pull platform status
- [ ] `syncEarnings(periodStart, periodEnd)` - Pull earnings for settlement calculation
- [ ] `syncDocuments(driverId)` - Push missing documents, handle rejections
- [ ] Idempotency: Track `boltSyncLog` with `idempotencyKey` per operation
- [ ] Scheduler: Cron job (Firebase Cloud Functions or SvelteKit + cron) - daily earnings sync, hourly status check

### 3.3 Sheet Fallback (`src/lib/server/bolt/sheetImport.service.ts`)
- [ ] Parse Bolt CSV/Excel exports (earnings, payouts, driver/vehicle status)
- [ ] Column mapping config per export type
- [ ] Validation: required fields, data types, cross-ref with DB
- [ ] Import UI: Admin upload → preview → confirm → process
- [ ] Deduplication: Match by Bolt internal IDs (driverId, vehicleId, tripId)

### 3.4 Bolt Data Mapping
- [ ] Map Bolt driver → internal driver (by PESEL, license number, phone)
- [ ] Map Bolt vehicle → internal vehicle (by registration number, VIN)
- [ ] Map Bolt trips → internal earnings (gross, commission, net, date, platform)
- [ ] Reconciliation report: Bolt vs internal, flag discrepancies

---

## 4. TELEMATICS INTEGRATION - Priority 3 (Parallel with Bolt)

### 4.1 Provider Abstraction (`src/lib/server/telemetry/`)
- [ ] `TelemetryProvider` interface: `authenticate()`, `fetchVehicles()`, `fetchTrips(dateRange)`, `fetchRealtime(deviceId)`, `subscribeWebhook()`
- [ ] Implementations: `GeotabProvider`, `WebfleetProvider`, `FleetCompleteProvider`, `GenericGpsProvider`
- [ ] Config per vehicle: `telemetryProvider`, `deviceId`, `accountId`

### 4.2 Data Ingestion
- [ ] Webhook endpoint: `/api/webhooks/telemetry/{provider}` - Verify, normalize, store to `telemetryEvents`
- [ ] Scheduled pull: Daily/hourly fetch for providers without webhooks
- [ ] Normalization: Convert to common schema (lat, lng, speed, ignition, fuel, odometer, harshAccel/Brake/Corner)

### 4.3 Derived Metrics (Computed Daily)
- [ ] `dailyVehicleStats`: distance, drivingTime, idleTime, fuelConsumed, harshEvents, maxSpeed, avgSpeed
- [ ] `driverBehaviorScore`: 0-100 based on harsh events, speeding, idle
- [ ] `vehicleUtilization`: % days active, km/day, revenue/km
- [ ] Alert: Device offline > 24h, harsh event threshold, geofence violation

---

## 5. PROVISIONS & FINANCE - Priority 4

> **Implementation:** See `LEDGER_SETTLEMENT_PLAN.md` for complete design — append-only driver balance ledger (`driverBalanceEvents` collection) with idempotent event writes, running balance per event, verification, and cash events. This section covers fleet-level reporting views over ledger data + operational cash tracking.

### 5.1 Fleet-Level Reporting (Read-Only Views)
- [ ] **Monthly P&L per vehicle**: Revenue (from ledger income events) - Lease - Insurance - Fuel - Maintenance - Fines - Provision (from ledger settlement events) = Net
- [ ] **Fleet aggregate**: Total revenue, total costs, fleet margin
- [ ] **Driver P&L**: Net payout (ledger) vs provision collected (ledger)
- [ ] Export: Excel with pivot tables, PDF summary

### 5.2 Cost Collection (Operational, Feeds Ledger)
- [ ] **Fuel card management**: Import transactions → match to vehicle/driver → validate → create `fuel_repayments` ledger events
- [ ] **Cash tracking (dual approach)**:
  - **Operational**: Daily report cash → `cashCollections` array on driver doc (for day-to-day tracking, reconciliation vs Bolt cash trips)
  - **Financial**: Ledger events — `cash_collection` (negative, driver owes), `cash_deposit` (positive, reduces debt), `cash_adjustment` (signed, disputes) — net cash deducted at monthly settlement
- [ ] **Maintenance/Insurance/Fines**: Admin-approved cost items → create ledger events (type TBD per `LEDGER_SETTLEMENT_PLAN.md`)

### 5.3 Reconciliation Reports
- [ ] **Income Event Reconciliation**: Uber/Bolt weekly API/sheet vs `income_uber_weekly` / `income_bolt_weekly` ledger events (TODO: include `cashCollected` in metadata)
- [ ] **Cash Reconciliation**: Bolt/Uber reported cash vs driver reported (`cashCollections`) vs deposits (ledger `cash_deposit`)
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
- [ ] Templates: Handover (assign/return/unilateral), Inspection (daily/monthly), Driver contract, NDA, GDPR consent
- [ ] Auto-send on: New driver, vehicle assignment, document expiring (30/14/7 days)
- [ ] Signed PDF → Store in Firebase Storage, link in `driverDocuments`/`vehicleDocuments`
- [ ] Expiry alerts: Create `alert` records, show in admin & driver dashboards

---

## 7. ALERTS, WARNINGS, REPORTS

### 7.1 Alert Engine (`src/lib/server/alerts/alertEngine.service.ts`)
- [ ] Scheduled evaluation (every 6h): Document expiry, inspection overdue, settlement ready, Bolt sync failed, telemetry offline, fuel anomaly, provision anomaly
- [ ] Real-time: New Bolt webhook error, driver daily report submitted, handover completed
- [ ] Channels: In-app (admin + driver), Email, Slack, Push (PWA)
- [ ] Escalation: Unacknowledged critical > 24h → notify superadmin
- [ ] Admin UI: Alert center with filters, bulk acknowledge, history

### 7.2 Key Reports (Admin)
- [ ] **Driver Balance Ledger / Current Balances**: All drivers, current balance, status, totals
- [ ] **Fleet Profitability**: Per vehicle, per driver, aggregate
- [ ] **Driver Performance**: Trips, earnings, rating, safety score, provision rate
- [ ] **Vehicle Utilization**: Active days, km, revenue/km, cost/km, downtime
- [ ] **Fuel Efficiency**: L/100km per vehicle, per driver, vs benchmark
- [ ] **Compliance Audit**: Document expiry matrix (driver × document type)
- [ ] **Income Event Reconciliation**: Uber/Bolt weekly API/sheet vs `income_uber_weekly` / `income_bolt_weekly` ledger events
- [ ] **Cash Reconciliation**: Reported vs Bolt cash trips, disputes
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
- 🔄 **Auth system rewrite**: Firebase Auth + session cookies, 6 route groups, revoked handling, per-handler API auth (see `AUTH_REWORK_PLAN.md`)
- 🔄 DB: New collections (driverBalanceEvents, dailyReports, fuelTransactions, alerts, telemetryEvents, boltSyncLog)
- 🔄 API: `(api)/driver`, `(api)/admin`, `(api)/shared`, `(api)/public` with per-handler auth
- 🔄 UI: Driver PWA layout + routes under `(driver)/`
- 🔄 Calculations: Driver balance ledger per `LEDGER_SETTLEMENT_PLAN.md`
- 🔄 Sync: Bolt client, telemetry providers, sheet importers
- 🔄 i18n: Add Paraglide for driver app (separate from admin i18n)

### 8.3 Tech Debt / Cleanup
- [ ] Migrate `src/lib/server/db/firebase/*.fdb.ts` to typed repositories
- [ ] Add Zod schemas for all API inputs (already have zod dep)
- [ ] Unit tests for calculation engine (vitest)
- [ ] E2E tests for critical flows (Playwright via vitest-browser)
- [ ] OpenAPI spec for `/api/driver/*` and `/api/admin/*`

---

## 9. IMPLEMENTATION SEQUENCE

### Phase 1: Backend Foundation (2-3 weeks)
0. **Auth system rewrite** (1 week) — per `AUTH_REWORK_PLAN.md`:
   - Types: `AdminRole = moderator|manager|admin`, `SessionClaims.role` includes `revoked`
   - Create `src/lib/server/auth/` module (firebaseAdmin, session, userLookup, adminAuth, driverAuth, generalAuth, apiAuth)
   - Create `src/hooks.server.ts` with 6 route groups, revoked check, sliding refresh
   - Route restructure: (auth), (driver), (admin), (general), (api), (webhooks)
   - Single `/login` page, Google Sign-In, password reset, logout
   - Test: revoked flow, role hierarchy, per-handler API auth
1. Extend Firestore schemas & security rules (including `driverBalanceEvents` rules)
2. Create new collections with indexes (including `driverBalanceEvents` composite indexes)
3. Build calculation engine (pure TS, heavily tested)
4. Implement driver balance ledger per `LEDGER_SETTLEMENT_PLAN.md` (events, running balance, verification, cash events)
5. Alert engine + notification channels

### Phase 2: Driver PWA (2-3 weeks)
1. Driver auth (Firebase custom claims + middleware per AUTH_REWORK_PLAN.md)
2. Driver layout + routes under `(driver)/` (mobile-first, PWA)
3. **Paraglide i18n setup**: Install packages, configure `project.inlang.json`, create message catalogs for 9 locales
4. Daily report form (offline-capable, fully translated)
5. Settlement view + PDF download (localized, reads from ledger)
6. Document center (view/upload/sign, multi-lang)
7. Push notifications (FCM, localized)
8. Language selector in profile, persist to driver record

### Phase 3: Bolt & Telemetry (3-4 weeks, after provider access)
1. Bolt API client + webhook handler
2. Sync orchestration (drivers, vehicles, earnings)
3. Sheet fallback importer
4. Telemetry provider abstraction + 1-2 implementations
5. Daily metrics computation + alerts

### Phase 4: Fleet Reporting (1-2 weeks)
1. Fuel card import + matching + anomalies
2. Cash tracking + reconciliation
3. Fleet P&L reports
4. Compliance audit report
5. Automated monthly report generation

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
4. **Multi-account**: Single Firebase project for all fleet accounts, or separate projects?
5. **Bolt fleet ID**: Do you have fleet ID and API credentials already?
6. **Telematics provider**: Which hardware/platform? (Determines integration effort)
7. **Payment rails**: How are driver payouts made? (Bank transfer, Blik, cash?)
8. **VAT invoicing**: Drivers B2B (issue invoice) or employment contract? (Affects settlement doc)
9. **Translation budget**: Professional translation for 8 non-Polish locales (~2000 strings) — use agency or in-house?
10. **Driver onboarding language**: Should signup flow be fully translated from day 1, or start with PL/EN/UK?

---

## 11. ESTIMATED TIMELINE

| Phase | Duration | Key Deliverable |
|-------|----------|-----------------|
| 1. Backend Foundation | 2-3 weeks | Ledger, calculations, alerts working |
| 2. Driver PWA | 2-3 weeks | Driver can submit reports, view settlements |
| 3. Bolt + Telemetry | 3-4 weeks | Automated sync, real-time vehicle data |
| 4. Fleet Reporting | 1-2 weeks | P&L, reconciliation reports |
| **Total** | **8-12 weeks** | **Production-ready fleet platform** |

---

*Generated from codebase analysis and requirements discussion. Update as priorities shift.*