# BigQuery Query Execution & Cost Controls

This document expands on Sections 7.2.2 and 7.4 of the BigQuery Migration Plan with concrete implementation details for the Admin UI query interface and cost guardrails.

---

## 5. Query API: Async Execution with Timeout Handling

### 5.1 Dual-Mode Execution Strategy

| Mode | Trigger | Behavior |
|------|---------|----------|
| **Fast path** | Estimated bytes < 1GB AND simple query (single partition, no complex JOINs) | Synchronous, returns results directly in < 30s |
| **Slow path** | Estimated bytes ≥ 1GB OR complex query OR user explicitly requests async | Async job → return `jobId` → client polls for completion |

### 5.2 API Contract

**POST `/api/admin/bigquery/query`** — Execute query

Request:
```json
{
  "sql": "SELECT ... FROM ... WHERE period = '2026-01'",
  "async": false,
  "maxBytesBilled": 10000000000
}
```

Response (sync success):
```json
{
  "mode": "sync",
  "rows": [...],
  "schema": [...],
  "stats": { "bytesBilled": 123456, "bytesProcessed": 98765, "executionMs": 1200 },
  "cacheHit": false
}
```

Response (async accepted):
```json
{
  "mode": "async",
  "jobId": "job_abc123",
  "status": "RUNNING",
  "pollUrl": "/api/admin/bigquery/query/job_abc123"
}
```

**GET `/api/admin/bigquery/query/{jobId}`** — Poll job status

Response:
```json
{
  "jobId": "job_abc123",
  "status": "RUNNING|DONE|FAILED|CANCELLED",
  "progress": { "elapsedMs": 45000 },
  "results": { "rows": [...], "schema": [...] }, // only when DONE
  "error": { "message": "...", "reason": "..." } // only when FAILED
}
```

**DELETE `/api/admin/bigquery/query/{jobId}`** — Cancel running job

### 5.3 Implementation Details

**File: `src/routes/api/admin/bigquery/query/+server.ts`**

```typescript
import { bigquery } from '$lib/server/db/bigquery/client';
import { validatePartitionFilter } from '$lib/server/db/bigquery/validators';

const MAX_SYNC_BYTES = 1_000_000_000; // 1GB
const MAX_SYNC_MS = 30_000;
const MAX_BYTES_BILLED = Number(process.env.BQ_MAX_BYTES_BILLED) || 10_000_000_000;

export async function POST({ request, locals }) {
  const { sql, async: forceAsync, maxBytesBilled } = await request.json();
  
  // 1. Validate partition filter (mandatory)
  if (!validatePartitionFilter(sql)) {
    return json({ error: 'Partition filter required (WHERE period=... or WHERE DATE(created_date)=...)' }, 400);
  }

  // 2. Dry-run for cost estimate
  const dryRun = await bigquery.createQueryJob({
    query: sql,
    location: 'europe-central2',
    dryRun: true,
    maximumBytesBilled: maxBytesBilled || MAX_BYTES_BILLED,
  });
  const [dryRunResult] = await dryRun.getQueryResults();
  const bytesBilled = Number(dryRunResult.totalBytesBilled || 0);

  // 3. Decide sync vs async
  const isSimple = isSimpleQuery(sql); // single table, no JOINs, single partition
  const useAsync = forceAsync || bytesBilled > MAX_SYNC_BYTES || !isSimple;

  if (useAsync) {
    const job = await bigquery.createQueryJob({
      query: sql,
      location: 'europe-central2',
      maximumBytesBilled: maxBytesBilled || MAX_BYTES_BILLED,
      timeoutMs: MAX_SYNC_MS,
    });
    const jobId = job.metadata.jobReference.jobId;
    await logQueryAudit(locals.user.id, sql, 'async_started', { jobId, bytesBilled });
    return json({ mode: 'async', jobId, status: 'RUNNING', pollUrl: `/api/admin/bigquery/query/${jobId}` });
  }

  // 4. Synchronous execution with timeout
  const job = await bigquery.createQueryJob({
    query: sql,
    location: 'europe-central2',
    maximumBytesBilled: maxBytesBilled || MAX_BYTES_BILLED,
    timeoutMs: MAX_SYNC_MS,
  });
  const [rows] = await job.getQueryResults({ maxResults: 10000 });
  
  await logQueryAudit(locals.user.id, sql, 'sync_completed', { 
    bytesBilled, 
    rowCount: rows.length,
    executionMs: Date.now() - startTime 
  });
  
  return json({
    mode: 'sync',
    rows,
    schema: job.metadata.statistics.query.schema.fields,
    stats: { bytesBilled, executionMs: Date.now() - startTime },
    cacheHit: false,
  });
}

export async function GET({ params, locals }) {
  const { jobId } = params;
  const job = bigquery.job(jobId);
  const [metadata] = await job.getMetadata();
  const status = metadata.status.state;

  if (status === 'DONE') {
    const [rows] = await job.getQueryResults({ maxResults: 10000 });
    return json({ jobId, status: 'DONE', results: { rows, schema: metadata.statistics.query.schema.fields } });
  }
  if (status === 'ERROR') {
    return json({ jobId, status: 'FAILED', error: metadata.status.errors?.[0] });
  }
  return json({ jobId, status: 'RUNNING', progress: { elapsedMs: Date.now() - metadata.statistics.startTime } });
}

export async function DELETE({ params, locals }) {
  const { jobId } = params;
  const job = bigquery.job(jobId);
  await job.cancel();
  await logQueryAudit(locals.user.id, '', 'cancelled', { jobId });
  return json({ success: true });
}
```

### 5.4 Query Result Caching

**File: `src/lib/server/db/bigquery/queryCache.ts`**

```typescript
import { db } from '$lib/server/db/firebase';

const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

export async function getCachedResult(queryHash: string, userId: string) {
  const doc = await db.collection('bigquery_query_cache').doc(queryHash).get();
  if (!doc.exists) return null;
  const data = doc.data();
  if (Date.now() - data.createdAt > CACHE_TTL_MS) return null;
  if (data.userId !== userId) return null; // user-scoped cache
  return data.results;
}

export async function setCachedResult(queryHash: string, userId: string, results: any) {
  await db.collection('bigquery_query_cache').doc(queryHash).set({
    userId,
    results,
    createdAt: Date.now(),
  });
}

function hashQuery(sql: string): string {
  // Simple hash for cache key (use crypto.subtle in production)
  return btoa(sql).slice(0, 32);
}
```

### 5.5 UI Integration (`QueryEditor.svelte`)

```svelte
<script>
  import { onMount } from 'svelte';
  
  let sql = '';
  let mode = 'sync'; // 'sync' | 'async' | 'polling'
  let jobId = '';
  let results = [];
  let stats = {};
  let error = '';
  let pollingInterval;

  async function execute() {
    error = '';
    const res = await fetch('/api/admin/bigquery/query', {
      method: 'POST',
      body: JSON.stringify({ sql, async: false }),
    });
    const data = await res.json();
    
    if (data.mode === 'async') {
      mode = 'polling';
      jobId = data.jobId;
      startPolling();
    } else {
      results = data.rows;
      stats = data.stats;
    }
  }

  function startPolling() {
    pollingInterval = setInterval(async () => {
      const res = await fetch(`/api/admin/bigquery/query/${jobId}`);
      const data = await res.json();
      if (data.status === 'DONE') {
        clearInterval(pollingInterval);
        mode = 'sync';
        results = data.results.rows;
        stats = { bytesBilled: data.results.stats?.bytesBilled };
      } else if (data.status === 'FAILED') {
        clearInterval(pollingInterval);
        error = data.error.message;
        mode = 'sync';
      }
    }, 2000);
  }

  function cancel() {
    if (jobId) fetch(`/api/admin/bigquery/query/${jobId}`, { method: 'DELETE' });
    clearInterval(pollingInterval);
    mode = 'sync';
  }
</script>

<div class="query-editor">
  <textarea bind:value={sql} placeholder="SELECT ... WHERE period = '2026-01'" />
  <button on:click={execute} disabled={mode === 'polling'}>Run Query</button>
  {#if mode === 'polling'}
    <button on:click={cancel}>Cancel</button>
    <span>Running... {Math.round((Date.now() - startTime) / 1000)}s</span>
  {/if}
  {#if error}<div class="error">{error}</div>{/if}
  {#if stats.bytesBilled}<div class="stats">Billed: {(stats.bytesBilled / 1e9).toFixed(2)} GB</div>{/if}
  <DataTable data={results} schema={schema} />
</div>
```

---

## 6. Cost Controls: Layered Defense

### 6.1 Defense Layers Summary

| Layer | Mechanism | Enforcement Point | Config |
|-------|-----------|-------------------|--------|
| **L1: Dry-run preview** | Free dry-run before execute, show estimate, require confirm if > warn threshold | API (pre-execution) | `WARN_GB=1`, `BLOCK_GB=10` |
| **L2: Job-level hard cap** | `maximumBytesBilled` — BigQuery kills query if exceeded, no charge | BigQuery engine | `MAX_BYTES_BILLED=10GB` |
| **L3: Partition filter mandate** | Regex validation of `WHERE` clause for partition column | API (request validation) | Mandatory |
| **L4: Row limit injection** | Server-side `LIMIT 10000` if absent | API (query rewrite) | `MAX_ROWS=10000` |
| **L5: Rate limiting** | 20 queries/min/user | API (Firestore counter) | `RATE_LIMIT=20/min` |
| **L6: Daily budget alert** | Cloud Monitoring alert on bytes billed | GCP Monitoring | Optional |

### 6.2 Dry-Run Preview Implementation

**File: `src/lib/server/db/bigquery/validators.ts`**

```typescript
export function validatePartitionFilter(sql: string): boolean {
  // Normalize: remove comments, collapse whitespace
  const normalized = sql
    .replace(/--.*$/gm, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\s+/g, ' ')
    .toUpperCase();

  // Must contain WHERE with period or created_date
  const whereMatch = normalized.match(/WHERE\s+(.+?)(?:\s+(?:ORDER|GROUP|LIMIT|$))/i);
  if (!whereMatch) return false;

  const whereClause = whereMatch[1];
  
  // Check for partition column references
  const partitionPatterns = [
    /PERIOD\s*[=<>]/i,
    /DATE\s*\(\s*CREATED_DATE\s*\)\s*[=<>]/i,
    /CREATED_DATE\s*[=<>]/i, // if DATE type
  ];

  return partitionPatterns.some(p => p.test(whereClause));
}

export function injectLimitIfMissing(sql: string, limit = 10000): string {
  const normalized = sql.trim().replace(/;$/, '');
  if (/LIMIT\s+\d+/i.test(normalized)) return normalized;
  return `${normalized} LIMIT ${limit}`;
}

export function estimateCost(bytesBilled: number): { gb: number; usd: number } {
  const gb = bytesBilled / 1e9;
  const usd = gb * 5.00; // $5/TB on-demand pricing (adjust for flat-rate)
  return { gb, usd };
}
```

**File: `src/routes/api/admin/bigquery/query/+server.ts` (add to POST handler)**

```typescript
// After dry-run, before execution
const { gb, usd } = estimateCost(bytesBilled);

if (gb > BLOCK_GB) {
  return json({ 
    error: `Query exceeds block threshold (${BLOCK_GB}GB). Estimated: ${gb.toFixed(2)}GB ($${usd.toFixed(2)})`,
    code: 'COST_BLOCKED',
    estimate: { gb, usd }
  }, 400);
}

if (gb > WARN_GB && !request.headers.get('x-confirm-cost')) {
  return json({
    error: `Query exceeds warn threshold (${WARN_GB}GB). Estimated: ${gb.toFixed(2)}GB ($${usd.toFixed(2)}). Resend with header 'x-confirm-cost: true' to proceed.`,
    code: 'COST_WARNING',
    estimate: { gb, usd }
  }, 409); // 409 Conflict = requires confirmation
}
```

### 6.3 Rate Limiting

**File: `src/lib/server/db/bigquery/rateLimit.ts`**

```typescript
import { db } from '$lib/server/db/firebase';

const WINDOW_MS = 60 * 1000; // 1 minute
const MAX_QUERIES = 20;

export async function checkRateLimit(userId: string): Promise<{ allowed: boolean; remaining: number; resetAt: number }> {
  const now = Date.now();
  const windowStart = now - WINDOW_MS;
  
  const counterRef = db.collection('bigquery_rate_limits').doc(userId);
  const snap = await counterRef.get();
  
  let requests = snap.exists ? snap.data()?.requests || [] : [];
  requests = requests.filter((ts: number) => ts > windowStart);
  
  if (requests.length >= MAX_QUERIES) {
    const oldest = Math.min(...requests);
    return { allowed: false, remaining: 0, resetAt: oldest + WINDOW_MS };
  }
  
  requests.push(now);
  await counterRef.set({ requests, updatedAt: now });
  
  return { allowed: true, remaining: MAX_QUERIES - requests.length, resetAt: now + WINDOW_MS };
}
```

### 6.4 Audit Logging

**File: `src/lib/server/db/bigquery/audit.ts`**

```typescript
import { db } from '$lib/server/db/firebase';

export async function logQueryAudit(
  userId: string,
  sql: string,
  action: 'sync_completed' | 'async_started' | 'async_completed' | 'failed' | 'cancelled',
  meta: Record<string, any>
) {
  await db.collection('admin_bq_audit').add({
    userId,
    sql: sql.slice(0, 5000), // truncate
    action,
    meta,
    timestamp: Date.now(),
  });
}
```

### 6.5 Configuration (Environment Variables)

```bash
# .env (server-only, never exposed to client)
BQ_MAX_BYTES_BILLED=10000000000        # 10GB hard cap per query
BQ_WARN_THRESHOLD_GB=1                  # Warn threshold for dry-run
BQ_BLOCK_THRESHOLD_GB=10                # Block threshold for dry-run
BQ_MAX_ROWS=10000                       # Row limit
BQ_RATE_LIMIT_PER_MIN=20                # Queries per minute per user
BQ_CACHE_TTL_HOURS=1                    # Query result cache TTL
BQ_DEFAULT_DATASET=app                  # Default dataset for unqualified tables
BQ_LOCATION=europe-central2             # BigQuery location
```

### 6.6 Monitoring & Alerting (GCP)

**Terraform/Manual Setup:**

```hcl
# Log-based metric for daily bytes billed
resource "google_logging_metric" "bq_daily_bytes" {
  name   = "bq_daily_bytes_billed"
  filter = <<-EOT
    resource.type="bigquery_project"
    protoPayload.methodName="jobservice.query"
    protoPayload.serviceName="bigquery.googleapis.com"
  EOT
  metric_descriptor {
    metric_kind = "DELTA"
    value_type  = "INT64"
    unit        = "By"
  }
  label_extractors = {
    user = "protoPayload.authenticationInfo.principalEmail"
  }
  value_extractor = "protoPayload.serviceData.jobCompletedEvent.job.jobStatistics.queryStatistics.totalBytesBilled"
}

# Alert policy: daily bytes > 1TB
resource "google_monitoring_alert_policy" "bq_daily_budget" {
  display_name = "BigQuery Daily Budget Exceeded"
  combiner     = "OR"
  conditions {
    display_name = "Daily bytes billed > 1TB"
    condition_threshold {
      filter         = "metric.type=\"logging.googleapis.com/user/bq_daily_bytes_billed\""
      duration       = "86400s"  # 24 hours
      comparison     = "COMPARISON_GT"
      threshold_value = 1000000000000  # 1TB
      aggregations {
        alignment_period   = "86400s"
        per_series_aligner = "ALIGN_SUM"
      }
    }
  }
  notification_channels = [google_monitoring_notification_channel.slack.id]
}
```

---

## 7. File Inventory for Implementation

| File | Purpose |
|------|---------|
| `src/routes/api/admin/bigquery/query/+server.ts` | Main query endpoint (sync + async + cancel) |
| `src/routes/api/admin/bigquery/query/[jobId]/+server.ts` | Polling endpoint for async jobs |
| `src/lib/server/db/bigquery/client.ts` | BigQuery client singleton (ADC auth) |
| `src/lib/server/db/bigquery/validators.ts` | Partition filter validation, limit injection, cost estimation |
| `src/lib/server/db/bigquery/rateLimit.ts` | Per-user rate limiting via Firestore |
| `src/lib/server/db/bigquery/audit.ts` | Audit logging to Firestore |
| `src/lib/server/db/bigquery/queryCache.ts` | Query result caching |
| `src/lib/components/admin/bigquery/QueryEditor.svelte` | UI component with polling UX |
| `src/lib/components/admin/bigquery/CostWarningModal.svelte` | Confirmation dialog for high-cost queries |

---

## 8. Open Questions

1. **Flat-rate vs on-demand pricing**: If on flat-rate, `maximumBytesBilled` still works but cost estimation changes. Confirm pricing model.

2. **Query cancellation UX**: Should cancel be immediate (DELETE) or graceful (mark for cancellation, let current scan finish)? BigQuery `job.cancel()` is immediate.

3. **Multi-user job visibility**: Should admins see each other's running jobs? Current design: jobs are user-scoped (rate limit + cache per user).

4. **Schema autocomplete**: For `QueryEditor` autocomplete, need to expose registered schemas via `/api/admin/bigquery/tables` — already in plan Section 7.3.

5. **Parameterized queries**: Support `?` placeholders for user inputs (date ranges, driver IDs) to prevent SQL injection and enable plan caching? BigQuery supports parameterized queries — worth adding.

---

*This document is an implementation companion to `BIGQUERY_MIGRATION_PLAN.md`. When Phase 3 begins, use this as the spec for the query API and cost control layers.*