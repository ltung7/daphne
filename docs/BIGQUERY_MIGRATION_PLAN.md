# BigQuery Migration & Data Split Plan

## 1. The Strategy: Lean Firestore, Fat BigQuery
Following the architectural guidelines for this application, financial and operational data is split across two databases:

1. **Firestore (The Lean Operational Ledger)**
   * Used for real-time running balances, UI rendering, and immediate financial actions (like monthly payouts or early settlements).
   * Schema is kept minimal. Metadata inside ledger events only contains routing/association data (e.g., `period`, `week`, `driverId`), **never** analytical statistics like trip counts or hours online.
2. **BigQuery (The Fat Statistical & Historical Vault) - *Currently Deferred***
   * Used for append-only historical records, large-scale aggregation, and complex reporting over time.
   * Holds the complete payload of data ingested from platforms (e.g., Uber/Bolt weekly summaries).

## 2. Target BigQuery Schema

When implemented, the primary table for weekly ingestion will be `weekly_platform_earnings`.

### Table: `weekly_platform_earnings`
Partitioned by: `period` (or a timestamp representation of the week).

| Field | Type | Description |
| :--- | :--- | :--- |
| `id` | STRING | Unique ingestion ID (e.g., `drv123:2026-W04`) |
| `driver_id` | STRING | ID of the driver |
| `week` | STRING | The ISO week string (e.g., `"2026-W04"`) |
| `period` | STRING | The payout month (e.g., `"2026-01"`) |
| `platform` | STRING | `"uber"` or `"bolt"` |
| `gross_earnings` | INTEGER | Gross platform earnings (minor units / grosze) |
| `platform_commission` | INTEGER | Platform fee (minor units / grosze) |
| `fleet_provision` | INTEGER | Fleet's cut (minor units / grosze) |
| `driver_net` | INTEGER | Driver's payout (minor units / grosze) |
| `trips_count` | INTEGER | Number of trips completed (statistical) |
| `hours_online` | FLOAT | Hours online (statistical) |
| `tips_amount` | INTEGER | Tips collected (minor units / grosze) |
| `tolls_amount` | INTEGER | Tolls collected (minor units / grosze) |
| `raw_csv_data` | STRING | JSON string of the exact row uploaded for audit purposes |
| `ingested_at` | TIMESTAMP | When the row was ingested |
| `ingested_by` | STRING | UID of the admin who uploaded it |

## 3. Implementation Roadmap (Deferred)

When the business is ready to implement BigQuery reporting, follow this plan:

### Schema & data access conventions
- Table schemas live in `src/lib/server/db/schemas/` (one file per table, e.g. `log_random.schema.ts` / `template.schema.ts`), exporting a `BQSchema` object (`fields` with `name`/`type`/`mode`/`description`, optional `index` and `editable`). Every schema file must be registered in `src/lib/server/db/schemas/index.ts` under its dataset — follows the `<name>.schema.ts` convention.
- Table data access lives in `src/lib/server/db/tables/` (one module per table, e.g. `randomLogs.db.ts` / `wrapper.db.ts`) and should use the shared helpers from `src/lib/server/db/tables/wrapper.db.ts` (`getItem`, `getItems`, `insertItems`, `updateItem`, `deleteData`, `truncateTable`, `tableExists`, ...) rather than building ad hoc queries — follows the `<name>.db.ts` convention.

### Phase 1: BigQuery Setup
- [ ] Provision a BigQuery dataset in the Google Cloud Project.
- [ ] Define the `weekly_platform_earnings` schema in `src/lib/server/db/schemas/` and register it in the schemas `index.ts`.
- [ ] Create the `weekly_platform_earnings` table with appropriate partitioning and clustering (cluster by `driver_id` and `platform`).
- [ ] Add the `@google-cloud/bigquery` SDK to the project.
- [ ] Create a generic BigQuery client in `src/lib/server/db/bigquery/client.ts`.
- [ ] Create the table data-access module in `src/lib/server/db/tables/` on top of the `wrapper.db.ts` helpers.

### Phase 2: Ingestion Dual-Write
- [ ] Update the `POST /api/finance/settlements/manual` endpoint.
- [ ] Ensure the existing Firestore transaction completes successfully first (atomic financial ledger).
- [ ] Implement a batch insert to BigQuery: construct the full statistical row and insert it into `weekly_platform_earnings`.
- [ ] Implement a robust retry/dead-letter queue mechanism in case the BigQuery insert fails after the Firestore transaction succeeds.

### Phase 3: Reporting UI & Queries
- [ ] Create `src/lib/server/db/bigquery/reports.bq.ts` to house complex queries (e.g., "Driver performance over the last 6 months").
- [ ] Build Admin UI views that specifically pull data from the BigQuery endpoints rather than fetching from Firestore.

### Phase 4: Table migration script (TODO)
- [ ] Create a top-level script (e.g. `scripts/migrateTable.ts`) that migrates a table based on its schema name (resolved from `src/lib/server/db/schemas/index.ts`).
  - **Caveat:** updating an existing BigQuery table's schema in place is nearly impossible. The script must instead: (1) back up the table's records, (2) destroy the table, (3) recreate the table with the new schema, (4) recover the data from the backup.
  - Backups are written to a JSON file under `/tmp/` using `fs` (write the full row data as JSON, do not rely on in-memory or SDK-only transfer).
  - The script should accept an optional filename argument: when provided, it skips the backup/destroy/recreate steps and only reads the backup file to recover data into the (already recreated) table.

---
*Note: Until this is implemented, ensure Firestore events (`driverBalanceEvents`, `companyLedgerEvents`) remain strictly lean to avoid massive read costs and performance degradation.*