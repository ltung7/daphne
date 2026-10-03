# BigQuery Migration & Data Split Plan

## 1. The Strategy: Lean Firestore, Fat BigQuery
Following the architectural guidelines for this application, financial and operational data is split across two databases:

1. **Firestore (The Lean Operational Ledger)**
   * Used for real-time running balances, UI rendering, and immediate financial actions (like monthly payouts or early settlements).
   * Schema is kept minimal. Metadata inside ledger events only contains routing/association data (e.g., `period`, `week`, `driverId`), **never** analytical statistics like trip counts or hours online.
2. **BigQuery (The Fat Statistical & Historical Vault) - *Currently Deferred***
   * Used for append-only historical records, large-scale aggregation, and complex reporting over time.
   * Holds the complete payload of data ingested from platforms (e.g., Uber/Bolt weekly summaries).

## 2. Schema & Data Access Conventions

Table schemas live in `src/lib/server/db/schemas/` (one file per table, e.g. `log_random.schema.ts` / `template.schema.ts`), exporting a `BQSchema` object with:
- `fields`: array of field definitions (`name`, `type`, `mode`, `description`)
- `index` (optional): array of field names used for clustering/indexing
- `editable` (optional): field name used as upsert key for **UI single-row inline edits only** (see Section 7.2.3)
- `created_date`: DATE — business date for partitioning (set by app on insert), used as **partition column** for time-unit partitioning
- `timestamp`: INTEGER — epoch milliseconds when record was created, used as primary sort field, value is `Date.now()`

Every schema file must be registered in `src/lib/server/db/schemas/index.ts` under its dataset — follows the `<name>.schema.ts` convention.

Table data access lives in `src/lib/server/db/tables/` (one module per table, e.g. `randomLogs.db.ts` / `wrapper.db.ts`) and should use the shared helpers from `src/lib/server/db/tables/wrapper.db.ts` (`getItem`, `getItems`, `insertItems`, `updateItem`, `deleteData`, `truncateTable`, `tableExists`, ...) rather than building ad hoc queries — follows the `<name>.db.ts` convention.

All tables will be partitioned by `created_date` (DATE, time-unit partitioning) or a domain-specific date field (e.g., `week_start`), with `timestamp` (INTEGER) as sort field.

## 3. Implementation Roadmap (Deferred)

When the business is ready to implement BigQuery reporting, follow this plan:

### Phase 1: BigQuery Setup
- [ ] Provision a BigQuery dataset in the Google Cloud Project.
- [ ] Define schemas in `src/lib/server/db/schemas/` and register them in the schemas `index.ts`.
- [ ] Create tables with appropriate partitioning and clustering.
- [ ] Add the `@google-cloud/bigquery` SDK to the project.
- [ ] Create a generic BigQuery client in `src/lib/server/db/bigquery/client.ts`.
- [ ] Create table data-access modules in `src/lib/server/db/tables/` on top of the `wrapper.db.ts` helpers.

### Phase 2: Ingestion Dual-Write
- [ ] Update the `POST /api/finance/settlements/manual` endpoint.
- [ ] Ensure the existing Firestore transaction completes successfully first (atomic financial ledger).
- [ ] Implement a batch insert to BigQuery: construct the full statistical row and insert it.
- [ ] Implement a robust retry/dead-letter queue mechanism in case the BigQuery insert fails after the Firestore transaction succeeds.

### Phase 3: Reporting UI & Queries
- [ ] Create `src/lib/server/db/bigquery/reports.bq.ts` to house complex queries (e.g., "Driver performance over the last 6 months").
- [ ] Build Admin UI views that specifically pull data from the BigQuery endpoints rather than fetching from Firestore.

### Phase 4: Table migration script (TODO)
- [ ] Create a top-level script (e.g. `scripts/migrateTable.ts`) that migrates a table based on its schema name (resolved from `src/lib/server/db/schemas/index.ts`).
  - **Caveat:** Updating an existing BigQuery table's schema in place is nearly impossible for structural changes. The script must instead: (1) back up the table's records, (2) destroy the table, (3) recreate the table with the new schema, (4) recover the data from the backup.
  - **Exception:** Additive changes (new `NULLABLE` columns) can use `ALTER TABLE ADD COLUMN` — simple, instant, no data copy needed. Reserve full recreate for: column type changes, mode changes (NULLABLE→REQUIRED), column removal, partitioning/clustering changes.
  - Backups are written to a JSON file under `/tmp/` using `fs` (write the full row data as JSON, do not rely on in-memory or SDK-only transfer).
  - The script should accept an optional filename argument: when provided, it skips the backup/destroy/recreate steps and only reads the backup file to recover data into the (already recreated) table.

## 4. BigQuery Table Schema Creation Guide

This section defines how to create BigQuery table schemas that align with this project's conventions and Google Cloud best practices.

### 4.1 Schema Definition Format (Project Convention)

Schemas live in `src/lib/server/db/schemas/<name>.schema.ts` and export a `BQSchema` object:

```typescript
// src/lib/server/db/schemas/log_random.schema.ts
export default {
    fields: [
        { name: "log_id", type: "STRING", mode: "REQUIRED", description: "Id of the log_random" },
        { name: "description", type: "STRING", mode: "REQUIRED", description: "Description of the log_random" },
        { name: "data", type: "STRING", mode: "REQUIRED", description: "Data of the log_random" },
        { name: "created_date", type: "DATE", mode: "REQUIRED", description: "Business date for partitioning (set by app on insert)" },
        { name: "timestamp", type: "INTEGER", mode: "REQUIRED", description: "Epoch ms when record was created" }
    ],
    index: ["description"],           // clustering columns
    editable: 'log_id',               // upsert key for UI single-row edits
    jsonable: 'data',                 // field containing JSON strings
    partition: { type: 'DATE', column: 'created_date' }  // optional override
}
```

**Required field properties:**
- `name` — column name (snake_case)
- `type` — BigQuery data type (STRING, INTEGER, FLOAT, BOOLEAN, TIMESTAMP, DATE, DATETIME, NUMERIC, BIGNUMERIC, RECORD/STRUCT, ARRAY, JSON)
- `mode` — REQUIRED, NULLABLE, or REPEATED (default: NULLABLE)
- `description` — human-readable description

**Optional schema-level properties:**
- `index` — array of column names for clustering (max 4, order matters: most-filtered first)
- `editable` — single field name used as upsert key for **UI single-row inline edits only** (see Section 7.2.3)
- `jsonable` — field name containing JSON strings (for automatic JSON parsing on insert)
- `partition` — override partition strategy: `{ type: 'DATE', column: 'created_date' }` (default: DATE on `created_date`). If a table has a domain-specific date field (e.g., `week_start`, `event_date`, `trip_date`), partition on that field instead — **omit `created_date` entirely** in that case.
- `timestamp` — epoch ms when record was created (primary sort field, `Date.now()`)

### 4.2 Data Type Mapping (TypeScript → BigQuery)

| TypeScript / App Type | BigQuery Type | Notes |
|---|---|---|
| `string` (UUID, IDs, enums) | `STRING` | |
| `number` (integer, grosze/cents) | `INTEGER` | Use for all money (minor units) |
| `number` (float, hours, rates) | `FLOAT` | Avoid for money |
| `boolean` | `BOOLEAN` | |
| `Date` / ISO timestamp string | `TIMESTAMP` | Partitioning column candidate |
| `string` (YYYY-MM-DD) | `DATE` | Partitioning column candidate |
| `string` (YYYY-MM-DD HH:MM:SS) | `DATETIME` | Partitioning column candidate |
| `bigint` / `string` (high precision) | `NUMERIC` / `BIGNUMERIC` | For precise decimals if needed |
| `object` / `Record<string,any>` | `JSON` | Stored as JSON string in STRING column |
| `T[]` | `ARRAY<T>` | Repeated mode; avoid nested REPEATED RECORD |

### 4.3 Partitioning Strategy (Mandatory)

**All tables must be partitioned.** Default pattern is **Option A: DATE with time-unit partitioning on `created_date`**. Two alternatives exist for specific cases.

#### Option A: DATE with time-unit partitioning on `created_date` (Default / Recommended)
Simplest DDL, daily partitions, timezone-agnostic, ideal for "give me data for date X" queries.
```sql
CREATE TABLE `project.dataset.table` (
  -- columns from schema.fields
  created_date DATE NOT NULL
)
PARTITION BY created_date
OPTIONS (
  partition_expiration_days = 3650,
  require_partition_filter = TRUE
);
```
- Partition filter: `WHERE created_date = '2026-01-15'`
- App sets on insert: `created_date: new Date().toISOString().split('T')[0]`

#### Option B: Domain-specific date field (e.g., `week_start`, `event_date`, `trip_date`)
If the table has a natural business date field, **partition on that field instead** — omit `created_date` entirely.
```sql
CREATE TABLE `project.dataset.table` (
  -- columns from schema.fields
  week_start DATE NOT NULL
)
PARTITION BY week_start
OPTIONS (
  partition_expiration_days = 3650,
  require_partition_filter = TRUE
);
```
- Partition filter: `WHERE week_start = '2026-01-05'`

#### Option C: TIMESTAMP with time-unit partitioning
Use if you need hourly partitioning or intra-day ordering.
```sql
CREATE TABLE `project.dataset.table` (
  -- columns from schema.fields
  partition_ts TIMESTAMP NOT NULL
)
PARTITION BY partition_ts
OPTIONS (
  partition_expiration_days = 3650,
  require_partition_filter = TRUE
);
```
- Partition filter: `WHERE partition_ts >= '2026-01-01' AND partition_ts < '2026-01-02'`
- Hourly: `PARTITION BY HOUR(partition_ts)`

#### Option D: INTEGER epoch ms with range partitioning
Explicit control over bucket boundaries (weekly shown).
```sql
CREATE TABLE `project.dataset.table` (
  -- columns from schema.fields
  timestamp INTEGER NOT NULL
)
PARTITION BY RANGE_BUCKET(timestamp, GENERATE_ARRAY(0, 4102444800000, 604800000))
OPTIONS (
  partition_expiration_days = 3650,
  require_partition_filter = TRUE
);
```
- Partition filter: `WHERE timestamp BETWEEN 1704067200000 AND 1704672000000`

**Key rules:**
- Partition column must be `DATE`, `TIMESTAMP`, `DATETIME`, or `INTEGER`
- **BigQuery does not support DEFAULT expressions on partition columns** — the application must set the value on every insert (e.g., `created_date: '2026-01-15'`, `timestamp: Date.now()`)
- Always set `require_partition_filter = TRUE` — queries without partition filter will fail
- Set `partition_expiration_days` to auto-clean old partitions
- For time-unit partitioning (A/B/C): partitions are created automatically per day/hour
- For range partitioning (D): define buckets covering your data retention window
- **If a table has a domain-specific date field (e.g., `week_start`, `event_date`, `trip_date`), partition on that field — do not add `created_date`**

### 4.4 Clustering Strategy (Recommended)

Add clustering on high-cardinality filter columns (max 4). Order matters: most selective / most filtered first.

```sql
CLUSTER BY driver_id, platform, week
```

**From schema:** the `index` array maps to clustering columns. Example from `log_random.schema.ts`:
```typescript
index: ["description"]
```

**Rules:**
- Clustering columns must be top-level, non-repeated
- Supported types: STRING, INTEGER, NUMERIC, BIGNUMERIC, TIMESTAMP, DATE, DATETIME, BOOL
- For partitioned + clustered tables: clustering applies within each partition
- Automatic reclustering happens in background

### 4.5 Creating Tables via Top-Level Script

The script (`scripts/createTables.ts`) should:
1. Load schema from `src/lib/server/db/schemas/index.ts`
2. Generate DDL `CREATE TABLE` statements with partitioning + clustering
3. Execute via `bigquery.createQueryJob()` (same client as `query.ts`)

**Minimal script skeleton:**
```typescript
// scripts/createTables.ts
import { bigquery } from '../src/lib/server/db/query.js';
import schemas from '../src/lib/server/db/schemas/index.js';

const DATASET = 'log'; // 'log' for log_* tables, 'report' for analytical tables, 'app' is legacy

// Default to DATE time-unit partitioning on created_date (Option A)
// Override per-table in schema if needed: 
//   schema.partition = { type: 'DATE', column: 'week_start' }  // domain-specific date
//   schema.partition = { type: 'TIMESTAMP', column: 'partition_ts' }  // hourly needed
//   schema.partition = { type: 'INTEGER', column: 'timestamp' }  // range partitioning
const DEFAULT_PARTITION = { type: 'DATE', column: 'created_date' };

async function createTable(dataset: string, tableName: string, schema: any) {
  const fields = schema.fields.map((f: any) => 
    `\`${f.name}\` ${f.type}${f.mode === 'REQUIRED' ? ' NOT NULL' : ''}`
  ).join(',\n  ');

  const partition = schema.partition || DEFAULT_PARTITION;
  const clusterCols = schema.index?.join(', ') || '';

  let ddl = `CREATE TABLE IF NOT EXISTS \`${dataset}.${tableName}\` (\n  ${fields}\n)`;
  
  if (partition.type === 'DATE' || partition.type === 'TIMESTAMP' || partition.type === 'DATETIME') {
    ddl += `\nPARTITION BY ${partition.column}`;
  } else if (partition.type === 'INTEGER') {
    ddl += `\nPARTITION BY RANGE_BUCKET(${partition.column}, GENERATE_ARRAY(0, 4102444800000, 604800000))`;
  }
  
  ddl += `\nOPTIONS (partition_expiration_days=3650, require_partition_filter=TRUE)`;
  if (clusterCols) ddl += `\nCLUSTER BY ${clusterCols}`;

  const [job] = await bigquery.createQueryJob({ query: ddl, location: 'europe-central2' });
  await job.getQueryResults();
  console.log(`Created ${dataset}.${tableName}`);
}
```

### 4.6 Money & Financial Columns (Strict)

- **Never use FLOAT for money.** All monetary values: `INTEGER` (minor units: grosze for PLN).
- Naming: `*_grosze`, `*_minor_units`, or suffix `_amount` with doc saying "minor units".
- Platform commission, fleet provision, driver net, tips, tolls — all `INTEGER`.

### 4.7 Standard Columns

Every table must include:
| Column | Type | Purpose |
|---|---|---|
| `created_date` | DATE | **Partition column** — business date, set by app on insert (`new Date().toISOString().split('T')[0]`). Used for time-unit partitioning. **Omit if table has a domain-specific date field** (e.g., `week_start`, `event_date`) — partition on that field instead. |
| `timestamp` | INTEGER | `Date.now()` — epoch ms when record was created, primary sort field. |

### 4.8 Registering Schemas

After creating `<name>.schema.ts`, register in `src/lib/server/db/schemas/index.ts`:
```typescript
import log_random from './log_random.schema.js'
import new_table from './new_table.schema.js'

export default {
  log: { log_random, log_balance, log_driver_events },  // tables prefixed with log_
  report: { driver_performance, fleet_summary },         // analytical/reporting tables
  app: { new_table, ... }  // legacy dataset
} as Record<string, Record<string, BQSchema>>
```

Then create data-access module in `src/lib/server/db/tables/new_table.db.ts` using `wrapper.db.ts` helpers.
---

## 5. Data Correction Strategy (Hard Rule)

When data mismatches or calculation/integration errors are discovered in BigQuery:

1. **Never update multiple rows in place.** BigQuery UPDATE operations on many rows are expensive, slow, and error-prone.
2. **Prefer mass delete + re-insert.** Delete the affected partition/week's data entirely, then re-insert corrected records from source (Firestore ledger events or raw ingestion payloads).
3. **Always mass-select first.** Before any correction, run a `SELECT` to verify exactly which rows/partitions are affected. Confirm counts and values.
4. **Partition-level operations.** Since tables are partitioned by `created_date` (daily), domain-specific date fields like `week_start` (DATE), or `timestamp` (weekly INTEGER buckets), corrections should target entire partitions (e.g., `WHERE created_date = '2026-01-15'` or `WHERE week_start = '2026-01-05'`), not arbitrary row subsets.

This applies to all BigQuery tables created under this plan.

---

## 6. Execution Strategy: Top-Level Scripts (Primary)

All BigQuery schema changes, table creation, data migrations, and corrections are executed via **top-level Node/TypeScript scripts** in `scripts/` (e.g., `scripts/createTables.ts`, `scripts/migrateTable.ts`).

- **Authentication:** Uses Google Cloud Application Default Credentials (ADC) — `gcloud auth application-default login` locally, or service account in CI/CD.
- **No MCP, no service workers.** The scripts import the existing BigQuery client (`src/lib/server/db/query.ts`) and schema definitions directly.
- **Run with:** `npx tsx scripts/<script>.ts` (add npm scripts in `package.json` for convenience).
- This is the **only supported path** for structural BigQuery operations in this project.

---

*Note: Until this is implemented, ensure Firestore events (`driverBalanceEvents`, `companyLedgerEvents`) remain strictly lean to avoid massive read costs and performance degradation.*

---

## 7. BigQuery Admin UI & Query Interface

### 7.1 Purpose
Build an internal Admin UI to visualize BigQuery data, run custom queries, and leverage schema-defined `editable` and `jsonable` fields for interactive data exploration and correction.

### 7.2 Core Features

#### 7.2.1 Table Browser
- List all registered BigQuery tables (from `schemas/index.ts`)
- Show schema fields with types, modes, descriptions
- Highlight `editable` field (upsert key) and `jsonable` field (JSON payload column)
- Paginated data preview with partition filter UI (`created_date` date picker or domain-specific date field selector)

#### 7.2.2 Custom Query Builder
- SQL editor with syntax highlighting (read-only `SELECT` only — no DDL/DML)
- Schema-aware autocomplete (table names, column names from registered schemas)
- Query history (last 50 queries per user, stored in Firestore)
- Export results as CSV/JSON
- **Partition enforcement**: UI must inject partition filter (`WHERE created_date = '...'` or `WHERE week_start = '...'` or domain-specific date field) — reject queries missing it

#### 7.2.3 Editable Field Inline Editing
- For tables with `editable` field defined in schema:
  - Render the `editable` column as clickable/edit-in-place
  - On save: call `updateOrInsertItems` (upsert via BigQuery MERGE) using the `editable` field as the key
  - Show diff preview before confirm
  - Audit log: write edit action to `admin_edits` Firestore collection (who, what, when, old/new values)

#### 7.2.4 JSONable Field Viewer & Downloader
- For tables with `jsonable` field defined:
  - Click cell → open modal with formatted JSON viewer (tree view, search, copy path)
  - "Download as JSON" button → downloads the parsed JSON object as `.json` file
  - "Raw" toggle → shows the raw STRING column value (for debugging malformed JSON)
  - This field typically contains full ingestion payloads (Uber/Bolt weekly summaries) where the shape is not strictly designed — the JSON viewer enables ad-hoc inspection without schema changes

### 7.3 Technical Implementation

| Component | Location | Notes |
|---|---|---|
| Route | `src/routes/admin/bigquery/` | Admin-only, guarded by staff role |
| Table list API | `src/routes/api/admin/bigquery/tables/+server.ts` | Returns schemas from `schemas/index.ts` |
| Query execution API | `src/routes/api/admin/bigquery/query/+server.ts` | Validates partition filter, enforces `SELECT` only, 30s timeout |
| Edit API | `src/routes/api/admin/bigquery/edit/+server.ts` | Upsert via `editable` key, audit log to Firestore |
| JSON export API | `src/routes/api/admin/bigquery/export/+server.ts` | Streams JSONable field content as file download |
| Components | `src/lib/components/admin/bigquery/` | `TableBrowser.svelte`, `QueryEditor.svelte`, `JsonViewer.svelte` |

### 7.4 Security & Guardrails
- **Read-only by default**: Query API only allows `SELECT` — block `INSERT`, `UPDATE`, `DELETE`, `CREATE`, `DROP`, `MERGE` (except via dedicated Edit API)
- **Partition filter mandatory**: Query parser validates `WHERE` clause contains partition column (`created_date`, `week_start`, domain-specific date field, or `timestamp`); return 400 if missing
- **Row limit**: Hard cap 10,000 rows returned (configurable via env)
- **Cost estimate**: Show `bytesBilled` estimate before execution (BigQuery dry run) — see `BIGQUERY_QUERY_AND_COST_CONTROLS.md` for full cost control implementation
- **Audit trail**: Every query execution and edit logged to Firestore `admin_bq_audit` collection
- **Rate limit**: Max 20 queries/minute per admin user

### 7.5 Integration with Schema Conventions
- `editable` field → drives the upsert key in Edit API; must be unique per partition; **used for UI single-row edits only**
- `jsonable` field → drives JSON viewer/downloader; content is parsed client-side (handle parse errors gracefully)
- `index` fields → suggested as default filters in Table Browser UI
- `created_date` field → partition filter column (DATE), required in WHERE clause (omit if using domain-specific date field)
- `timestamp` field → default sort column (descending)

---

## 8. BigQuery Operations Skill Reference

For all BigQuery schema creation, table management, data migration, and querying tasks, refer to the dedicated skill at:

**`.opencode/skills/bigquery-operations/SKILL.md`**

This skill provides:
- Step-by-step workflows for creating schemas in `src/lib/server/db/schemas/`
- Table creation scripts using the conventions in Section 4
- Data migration patterns following the correction strategy in Section 5
- Query execution patterns with partition enforcement
- Integration with the Admin UI components in Section 7

When working with BigQuery in this project, always consult this skill first to ensure consistency with the conventions defined in this document.

## 9. Related Documents

- `BIGQUERY_QUERY_AND_COST_CONTROLS.md` — **Deferred** — Implementation spec for async query execution, six-layer cost controls, rate limiting, audit logging, and monitoring