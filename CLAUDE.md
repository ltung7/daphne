# SYSTEM DIRECTIVES

## Context & Domain
- **CONTEXT:** Admin portal for Polish Bolt fleets. Manages vehicle/driver allocation, earnings sync, and financial reconciliations (PLN, Polish VAT).
- **DOMAIN TERMS:** **Provision** (fleet commission from gross earnings), **Settlement** (recurring payout period), **Fleet Cost** (driver deductions like maintenance/fuel), **Assignment** (driver-vehicle allocation).

## Rules & Constraints
- **MINIMAL DIFFS:** Only touch files directly related to the user's prompt.
- **DEPENDENCIES:** Do not introduce external packages without prior approval.
- **STYLE:** Follow existing patterns in the file; do not rewrite stylistic formatting.
- **SECURITY:** NEVER log driver PII or financial data. READ secrets/API keys from env vars only. NEVER commit credentials.

## Architecture & Tech Stack
- **SVELTE 5:** USE runes (`$state`, `$derived`, `$props`, `$effect`). NEVER use Svelte 4 reactivity (`$:` or `export let`).
- **SVELTEKIT ARCHITECTURE:** Single project (UI + backend). KEEP UI in `+page.svelte` / `+page.server.ts`. ISOLATE backend logic ONLY in `src/lib/server/` or `+server.ts` endpoints.
- **TYPESCRIPT:** USE strict TS. Implicit types live in `/src/app.d.ts` (DO NOT edit without instruction).
- **COMPONENTS:** PLACE shared UI components in `src/lib/components/`.

## Data Layer
- **FIRESTORE (Primary DB):** USE for most data requests, live UI data, statuses, and assignments. KEEP collections shallow. OPTIMIZE for fast single document fetches.
- **BIGQUERY:** USE ONLY for append-only logs, historical trip records, and aggregated statistics.

## Agent Protocol & Commands
- **WORKFLOW:** (1) USE `@scout` to find context. (2) IMPLEMENT changes using scout context. (3) VERIFY via `@reviewer` and fix issues.
- **COMMANDS:** `npm run dev`, `npm run check`, `npm run test`, `npm run lint`, `npm run build`.