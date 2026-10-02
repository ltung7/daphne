---
name: edit-settings
description: Use when adding, editing, updating, or removing platform settings, blueprint nodes, setting schemas, or configuration options in Daphne.
---

# Edit Platform Settings

## Overview
Platform settings are stored in Firestore under a single collection (`settings`), partitioned by Group documents (top-level document IDs matching settings categories). 

The architecture is blueprint-driven:
- **Blueprints** define the UI layout, input types, defaults, and dot-notation paths.
- **Zod schemas** define validation rules and derive TypeScript types.
- **Dot-notation paths** (`<group>.<subgroup>.<field>`) allow fine-grained updates without overwriting sibling keys.

> **Important:** Do not hardcode or assume existing groups or fields. Groups and settings will evolve. Always check the current files in `src/lib/settings/blueprints/` and schemas in `src/lib/assets/zodschemas/settings.zod.ts`.

---

## Directory & File Reference

| Area | Path | Responsibility |
|---|---|---|
| **Schemas & Types** | `src/lib/assets/zodschemas/settings.zod.ts` | Zod validation schemas for groups/subgroups and exported `z.infer` TypeScript types. |
| **Blueprints Directory** | `src/lib/settings/blueprints/` | Declarative UI configuration files for each group. |
| **Blueprint Registry** | `src/lib/settings/blueprints/index.ts` | Exports `platformSettingsBlueprint` aggregating all active group blueprints. |
| **Blueprint & Store Types** | `src/lib/types/settings.ts` | Interfaces (`CustomConfigNode`, `ConfigsBlueprintNode`, `ConfigsBlueprint`) and dot-notation flattening helpers (`flattenConfig`, `unflattenConfig`, `getConfigValue`). |
| **Database Access** | `src/lib/server/db/firebase/settings.fdb.ts` | Firestore functions (`getSettingsGroup`, `setSettingsGroup`, `updateSettingsGroup`) and the `SettingsGroups` type registry. |
| **Admin Route** | `src/routes/(admin)/settings/+page.server.ts` & `+page.svelte` | Server load (fetches groups) and `?/save` form action (splits dot-notation patches and saves per group). |
| **UI Components** | `src/lib/components/settings/` | `SettingsSectionWrapper`, `SettingsSection`, `SettingsLine`, `SettingsInput`, `SettingsButton`, `SettingsSearchResult`. |
| **Business Logic** | `src/lib/server/calculations/`, services, routes | Backend consumers fetching settings dynamically via `getSettingsGroup`. |

---

## Step-by-Step Guide

### 1. Inspect Current Blueprints and Schemas
Before writing code:
1. Browse `src/lib/settings/blueprints/` to find the relevant blueprint file (or inspect `index.ts` for registered groups).
2. Read `src/lib/assets/zodschemas/settings.zod.ts` to understand existing subgroups, validators, and types.

---

### 2. Update Schemas and Types
**File:** `src/lib/assets/zodschemas/settings.zod.ts`

- **Editing an existing field:** Adjust types, validators, min/max limits, or error messages.
- **Adding a new field to an existing group:** Add the field to the matching subgroup schema.
  - Money values: `z.number().min(0)` stored in minor units (**grosze**, e.g., 50.00 PLN = `5000`).
  - Rates / Percentages: `z.number().min(0).max(1)` (e.g., 0.15 = 15%).
  - Toggles: `z.boolean()`.
  - Strings: `z.string()` or `c.nonEmptyString('Nazwa')`.
  - Mark fields `.optional()` if existing database documents may not have them yet.
- **Creating a new group:**
  - Define the subgroup and group Zod schemas.
  - Export the schema and inferred type (`export type NewGroupSettings = z.infer<typeof newGroupSchema>;`).
  - Register the new group in `SettingsGroups` in `src/lib/server/db/firebase/settings.fdb.ts`.

---

### 3. Update or Create Blueprint Nodes
**Location:** `src/lib/settings/blueprints/`

Find the relevant `<group>.blueprint.ts` file and add or modify the field in the `nodes` array:

```typescript
{
    caption: 'Etykieta w UI (język polski)',
    description: 'Opis pomocniczy widoczny pod etykietą',
    node: '<group>.<subgroup>.<field>', // Full dot-notation matching the schema
    type: 'number',                    // 'boolean' | 'number' | 'string' | 'list' | 'color' | 'link' | 'action'
    default: 0,
    min: 0,
    max: 100,
    decimal: true,                     // Set true for floating-point numbers / percentages
    admin: true,                       // Restrict editing to admin users
    options: { key: 'Etykieta' },      // Required if type is 'list'
    sub: [ /* optional conditional CustomConfigNode[] displayed when parent value is truthy */ ]
}
```

#### If adding a new group:
1. Create `src/lib/settings/blueprints/<newGroup>.blueprint.ts`:
   ```typescript
   import type { ConfigsBlueprintNode } from '$lib/types/settings';

   export const newGroupBlueprintNode: ConfigsBlueprintNode = {
       caption: 'Tytuł Sekcji',
       anchor: 'KrótkaNazwaMenu',
       description: 'Opis sekcji',
       icon: 'gear',
       nodes: [ /* CustomConfigNode[] */ ]
   };
   ```
2. Register it in `src/lib/settings/blueprints/index.ts`:
   - Import `newGroupBlueprintNode`.
   - Add it to `platformSettingsBlueprint.nodes`.
   - Update `PlatformSettingSection` union type if defined.

---

### 4. Update Route Load (Only if Adding a New Group)
If working within an existing group, skip this step. The save action handles dynamic dot-notation patches automatically.

If adding a new Group:
1. **`src/routes/(admin)/settings/+page.server.ts`**:
   - Add `getSettingsGroup('<newGroup>')` to the `Promise.all` in `load`.
   - Return it under `settings.<newGroup>`.
2. **`src/routes/(admin)/settings/+page.svelte`**:
   - Add `<newGroup>: data.settings.<newGroup> ?? {}` to `initialValues`.

---

### 5. Consume Settings in Backend Logic
In any calculation, service, or server route:

```typescript
import { getSettingsGroup } from '$lib/server/db/firebase/settings.fdb';

// Strongly typed via SettingsGroups registry
const groupData = await getSettingsGroup('<group>');
const settingValue = groupData?.<subgroup>?.<field> ?? defaultValue;
```

For programmatic updates (e.g., migrations, scripts, seeders):
```typescript
import { updateSettingsGroup } from '$lib/server/db/firebase/settings.fdb';

// Uses dot-notation to patch without overwriting siblings
await updateSettingsGroup('<group>', {
    '<subgroup>.<field>': newValue
});
```

---

### 6. Verification
1. Run `npm run check` (svelte-check) to verify TypeScript types across schemas, blueprints, and server code.
2. Confirm the blueprint `node` path (`<group>.<subgroup>.<field>`) aligns exactly with the nested object structure in `settings.zod.ts`.
3. Check UI rendering and dirty-save behavior under `/settings`.
