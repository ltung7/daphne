# Platform Settings Plan

## Objective
Establish a centralized system for storing, managing, and retrieving platform-wide settings (e.g., integration parameters, financial variables, company defaults) using Firebase Firestore. This allows admins to adjust logic variables without redeploying the code.

## Database Structure (Firestore)

To maintain a clean and organized database, all settings will be stored within a single top-level collection. The structure is broken down into **Groups** (Documents) and **Subgroups** (Nested Objects).

*   **Collection Name:** `settings` (or `platformSettings`)
    *   **Document:** Represents a **Settings Group** (e.g., `rideServices`, `company`). The Document ID will strictly be the group name.
    *   **Subgroup:** Nested maps/objects within the document containing related key-value pairs.

### Proposed Data Model

#### 1. Group: Ride Services
Manages settings related to external ride-hailing platforms like Bolt.
*   **Document Path:** `settings/rideServices`
*   **Data Structure:**
    ```json
    {
      "bolt": {
        "boltRate": 0.15
      }
    }
    ```

#### 2. Group: Company
Manages internal fleet company parameters and commission rates.
*   **Document Path:** `settings/company`
*   **Data Structure:**
    ```json
    {
      "finances": {
        "provisionRate": 0.50          // Percentage of earnings (e.g. 0.50 = 50%)
      }
    }
    ```

## Implementation Guidelines

### 1. Type Safety & Validation
*   Define Zod schemas in `src/lib/assets/zodschemas/settings.zod.ts` for each document type to validate the data shape.
*   Extract TypeScript types from these schemas to guarantee type safety throughout the codebase.

### 2. Reading Settings (Backend & Calculations)
*   Calculations (e.g., driver payouts, provision deductions) must fetch these dynamic settings instead of using hardcoded constants.
*   If settings are read frequently (e.g., inside loops over thousands of rides), consider loading them once at the start of the process (or utilizing a short-lived memory cache/Firestore cache) to minimize database reads.

### 3. Admin UI (Blueprint-Driven Architecture)
The frontend for managing these settings uses a **Blueprint-driven UI** implemented under `src/lib/components/settings/`. This allows generating dynamic configuration forms straight from JSON-like definitions without touching Svelte markup for each new field.

*   **Mapping to Firestore:** 
    *   The Blueprint sections (`global`, `terms`, `rideServices`) map directly to the Firestore Group documents (`settings/company`, `settings/rideServices`).
    *   The `node` properties in the Blueprint use dot-notation (e.g., `finances.driverProvision`, `bolt.boltRate`) to match the subgroup schema.
*   **Reactive State & Dirty Tracking:** Using Svelte 5 stores and a tracking `SvelteSet` (`$configs.dirty`), the UI automatically tracks which nested fields have been modified. 
*   **Saving Changes:** When the user clicks "Save", the system maps the `$configs.dirty` set into a Firestore dot-notation patch payload (e.g., `updateSettingsGroup('company', { 'finances.driverProvision': newValue })`), ensuring no sibling fields are accidentally overwritten.
*   **Sub-settings:** Features can conditionally show sub-inputs which map directly into our nested subgroup architecture.

### 4. Security Rules
*   The `settings` collection must be strictly protected via `firestore.rules`.
*   Only authenticated users with the `admin` (or equivalent staff role) custom claim should be granted `read` and `write` permissions to this collection.

### 5. Audit Logging (Recommended)
*   Any modification to platform settings (especially financial variables) should generate an audit log entry.
*   This log should record the `adminId`, `timestamp`, `previousValue`, and `newValue` for traceability.

### 6. Developer Skill (`edit-settings`)
A dedicated opencode skill is maintained in `.opencode/skills/edit-settings/SKILL.md`. It provides a streamlined workflow for adding, modifying, and removing settings, schemas, and blueprint nodes without needing full architectural plans or hardcoded structures.

---

## Phased Implementation Todo List

### Phase 1: Foundation & Data Modeling (Backend)
- [x] **1.1 Firestore Security Rules:** *(Skipped as requested)*
- [x] **1.2 Zod Schemas:** Created in `src/lib/assets/zodschemas/settings.zod.ts` (`rideServicesSettingsSchema`, `companySettingsSchema`).
- [x] **1.3 Database Helpers:** Created Firestore query wrappers (`getSettingsGroup`, `setSettingsGroup`, `updateSettingsGroup`) in `src/lib/server/db/firebase/settings.fdb.ts`. Supports dot-notation path patching via Firestore update.

### Phase 2: UI Blueprint Components (Frontend Foundation)
- [x] **2.1 Core Types:** Ported TS interfaces and dot-notation helpers to `src/lib/types/settings.ts`.
- [x] **2.2 Input Component:** Built `SettingsInput.svelte` rendering fields based on node `type` (`boolean`, `number`, `string`, `list`, `color`).
- [x] **2.3 Line & Section Components:** Built `SettingsLine.svelte` (recursive wrapper with conditional `sub` rendering), `SettingsButton.svelte` (action/link nodes), and `SettingsSection.svelte` (category loop with adapter filtering).
- [x] **2.4 Main Layout Wrapper:** Built `SettingsSectionWrapper.svelte` with sidebar navigation, search support (`SettingsSearchResult.svelte`), reset mechanism, and reactive `$configs.dirty` save flow.

### Phase 3: Configuration Page & Blueprints (Integration)
- [x] **3.1 Blueprint Definitions:** Created blueprint schemas in `src/lib/settings/blueprints/` (`rideServices.blueprint.ts`, `company.blueprint.ts`, `index.ts`) mapping to Firestore group structures.
- [x] **3.2 Settings Route:** Created `src/routes/(admin)/settings/+page.svelte` and `+page.server.ts`, linked in sidebar navigation.
- [x] **3.3 Load Data:** Implemented `load` in `+page.server.ts` fetching `rideServices` and `company` groups via `getSettingsGroup`.
- [x] **3.4 Save Action:** Implemented form action `?/save` in `+page.server.ts` to receive dirty dot-notation updates and patch Firestore safely using `updateSettingsGroup`.

### Phase 4: Consumption & Polish
- [ ] **4.1 Wiring to Calculations:** Refactor existing billing/provision logic in `src/lib/server/calculations/` to load and use settings from Firestore instead of hardcoded numbers.
- [ ] **4.2 Audit Logging:** Add a wrapper in the `updateSettingsGroup` function to append an audit log to BigQuery or an `auditLogs` Firestore collection.
- [ ] **4.3 UI Polish:** Add success/error toasts on save and ensure the sticky sidebar behaves nicely on all screen sizes.
- [x] **4.4 Developer Skill:** Created `edit-settings` skill in `.opencode/skills/edit-settings/SKILL.md` for adding, modifying, and managing blueprint-driven platform settings.
