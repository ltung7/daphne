# CLAUDE.md

Admin portal for a company operating vehicles driven on Uber and Bolt in Poland. Fleet ops staff use this app to manage vehicles and drivers, sync trip/earnings data from Uber and Bolt, and calculate what each driver owes the fleet (provision) and what the fleet spends (maintenance, insurance, fuel, etc.).

This is a single SvelteKit project — UI and backend logic live together in one codebase. No monorepo, no separate services.

> Assumption: Polish market (PLN, Polish VAT/invoicing rules, GDPR). Correct this if wrong — it affects currency formatting, tax logic, and the compliance notes below.

## Tech stack
- SvelteKit + Svelte 5 — use runes (`$state`, `$derived`, `$effect`, `$props`) in new code, not the Svelte 4 `$:` reactive style
- UI in `+page.svelte` / `+page.server.ts`; backend-only logic in `src/lib/server/` and `+server.ts` endpoints — SvelteKit keeps `src/lib/server/` out of the client bundle
- TypeScript throughout (adjust if not accurate)
- Single npm project, plain `npm` scripts — no workspaces, no Turborepo/Nx
- i18n: Polish primary locale via `$i18n` message calls (`m.*`), JSON source under `/messages/pl/`

## What this app does
1. **Admin UI** — vehicle/driver management, assignment, finance review, Uber/Bolt sync status
2. **Uber/Bolt integration** — server-side sync of trip, earnings, and payout data from both platforms
3. **Calculations** — turns that raw data into each driver's provision and net payout per settlement period

If a driver-facing app exists now or gets built later (separate repo or not), it calls into this app's server endpoints rather than talking to Uber/Bolt or running calculations itself. Keep that boundary in the code even though everything currently lives in one place — see "Key areas" below for where.

## Domain glossary
- **Provision** — the fleet's own commission taken from a driver's gross Uber/Bolt earnings, distinct from Uber's/Bolt's own platform commission (already deducted before the driver sees the payout)
- **Settlement / payout period** — the recurring window (commonly weekly, matching Uber/Bolt payout cycles) over which earnings, provision, and cost deductions are reconciled per driver
- **Fleet cost** — maintenance, insurance, fuel, fines, etc. attributed to a vehicle or driver, deducted from or billed against the driver's net
- **Vehicle assignment** — the (usually time-bounded) link between a driver and a vehicle; a vehicle can rotate between drivers

## Uber/Bolt integration conventions
- Keep each platform's client isolated (`src/lib/server/uber/`, `src/lib/server/bolt/`) behind a shared internal interface — the two APIs won't have identical shapes, auth, or rate limits
- All external calls are idempotent or de-duplicated on replay; webhooks and polling can both redeliver the same event
- API credentials and webhook secrets come from environment variables / a secret manager only, never committed
- Log request/response metadata for debugging, never full payloads containing driver PII or bank details
- Webhooks are `+server.ts` routes (e.g. `src/routes/api/webhooks/uber/+server.ts`) — verify the platform's signature before processing anything

## Calculation logic
- Lives in `src/lib/server/calculations/`, kept pure (input data in, breakdown out) and unit-tested independently of the Uber/Bolt clients and the database writes
- Every output breakdown keeps its line items (gross earnings, platform commission, fleet provision, cost deductions, net) — never collapse straight to a single number
- Money as integer minor units (grosze) or a decimal type throughout — no floats
- Treat this like billing code: it needs the heaviest test coverage in the app
- Treat Uber/Bolt-reported earnings as the source of truth; reconcile, don't silently override, when internal calculations disagree

## Data layer: BigQuery vs Firebase

| Use BigQuery when... | Use Firebase (Firestore) when... |
|---|---|
| Data is historical / append-only (trip records, settlement history, audit logs) | Data changes frequently and the UI needs it live (driver online status, active assignment, sync-in-progress state) |
| You need aggregation/reporting across many rows or a long time range | You need a single record fetched or listened to fast |
| Write pattern is batch (nightly / per settlement period) | Write pattern is small, frequent, per-user-action |
| Schema is simple/tabular | Data is nested/document-shaped and evolves per feature |

- BigQuery tables are append-only; corrections are new rows, never in-place updates
- Partition and cluster large BigQuery tables by date; every query must hit the partition column — no unbounded `SELECT *`
- Don't query BigQuery directly for anything rendered on every page load — it's priced per byte scanned and isn't built for that latency
- Firestore collections stay shallow — avoid deep nesting that forces large reads for small updates
- Firestore security rules (`firestore.rules`) independently enforce the same scoping as the server-side auth checks below — never rely on client code alone to restrict access
- Data-access code lives in `src/lib/server/db/` (one module per logical table/collection) — don't build ad hoc queries inline in routes

## Auth & roles
- Firebase Auth. Session/token verification is centralized in `src/lib/server/auth/`, not reimplemented per route
- `admin` / staff role — gates every UI route in `hooks.server.ts`; there is no public admin route
- If any endpoint here is called by a driver-facing surface, it needs its own driver-scoped check (never the staff role check) and must only ever return that driver's own data — enforce server-side, not just filtered in the UI
- Any change to role definitions or permission scopes needs updating everywhere it's checked in the same change

## Money and financial calculations
- Never use floating point for money. Use integer minor units (grosze) or a decimal library end-to-end, from Uber/Bolt ingestion through to what's displayed
- Currency/number formatting goes through one shared helper (`src/lib/format/` or similar) — don't reimplement it per component

## Security & compliance
- Driver PII (ID documents, addresses, bank details) and financial data are sensitive — never log full values; mask in any debug output
- EU/Poland-scoped: GDPR applies to driver data. Flag any new data collection or third-party data share for review rather than assuming it's fine
- API credentials for Uber/Bolt/Firebase/BigQuery live in environment variables or a secret manager, never in code or committed config

## UI conventions
- Components in `src/lib/components/`, idiomatic Svelte 5 (runes-based props, `$props()`, no legacy `export let`)
- Keep components accessible by default (labels, focus states, sufficient contrast)
- All user-facing strings go through `$i18n` (`m.*`) — never hardcode Polish (or any) text directly in markup

## Key areas
- `src/routes/fleet/` — vehicle & driver CRUD, assignment (UI)
- `src/routes/finance/` — provision calculations, cost breakdowns, payout review (UI)
- `src/routes/integrations/` — Uber/Bolt sync status and reconciliation issues (UI)
- `src/routes/api/webhooks/` — Uber/Bolt webhook receivers
- `src/routes/api/driver/` — endpoints for a driver-facing consumer, if/when one exists
- `src/lib/server/` — Uber/Bolt clients, calculations, auth, db access — anything server-only
- `src/lib/components/` — shared UI components

(Adjust the paths above once the real route tree exists.)

## Commands
- Install: `npm install`
- Dev: `npm run dev`
- Type-check: `npm run check` (svelte-check)
- Build: `npm run build`
- Test: `npm run test`
- Lint: `npm run lint`