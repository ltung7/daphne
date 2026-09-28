# Admin Incident List UI Implementation Plan

## 1. Overview
A new admin-only interface for viewing, filtering, and resolving system incidents. It operates strictly on Polish content (no UI i18n for incident data), utilizes server-side filtering, relies on epoch timestamps, and provides a quick `<pre>`-based metadata view.

## 2. Core Constraints & Decisions
*   **Routing**: Top-level `/(admin)/incidents` and `/(admin)/incidents/[id]`.
*   **Data Size**: No fixed page size / no pagination. It loads all matching results for the selected date range.
*   **Time Handling**: Epoch timestamps (`timestamp` and `resolvedAt`). Hardcoded sorting to `timestamp DESC`.
*   **Default Range**: Last 7 days.
*   **Filtering**: Server-side only. Requires `from` and `to` timestamps. Optional filters: `severity`, `category`, `status`, `source`.
*   **Localization**: `title` and `description` are displayed exactly as saved (Polish via `m_pl`). UI shell (buttons, headers) uses standard localized text.
*   **Metadata**: Displayed as formatted JSON inside a `<pre>` block on the detail page.
*   **Sidebar**: Includes a real-time (or load-time) badge indicating the number of `open` incidents.

## 3. Implementation Steps

### Step 1: Database Layer Enhancements
*   **File**: `src/lib/server/db/firebase/incidents.fdb.ts`
*   **Task**: Ensure queries can support complex `where` clauses (date ranges + status/severity) and `orderBy('timestamp', 'desc')`. May require adding composite index configurations to `firestore.indexes.json` later if Firebase demands it.
*   **Task**: Add a helper function `countOpenIncidents()` to efficiently fetch the badge number for the sidebar.

### Step 2: List Route (Server)
*   **Files**: `src/routes/(admin)/incidents/+page.server.ts`, `src/routes/(admin)/incidents/api/+server.ts`
*   **Task**: 
    *   Parse URL search params (`from`, `to`, `severity`, `status`, etc.).
    *   If missing, default `from` to `Date.now() - 7 days` and `to` to `Date.now()`.
    *   Fetch sorted data from Firebase and return to the client.

### Step 3: List Route (UI)
*   **File**: `src/routes/(admin)/incidents/+page.svelte`
*   **Task**: 
    *   Create a filter bar with two date inputs and `<select>` dropdowns for the enums.
    *   Create a standard HTML `<table>` (bypassing `DatatableWrapper` since filtering is strictly server-side and unpaginated).
    *   Map `severity` to Bootstrap badge classes (low = secondary, medium = warning, high = danger, critical = dark).
    *   Row click redirects to `[id]`.
    *   Include a "Refresh" button that triggers a server reload with current query params.

### Step 4: Detail Route
*   **Files**: `src/routes/(admin)/incidents/[id]/+page.svelte`, `src/routes/(admin)/incidents/[id]/+page.server.ts`, `src/routes/(admin)/incidents/[id]/api/+server.ts`
*   **Task**: 
    *   Load specific incident by ID.
    *   Render Header (Title, badges).
    *   Render Description (text).
    *   Render Metadata (`<details><pre>{JSON.stringify(metadata, null, 2)}</pre></details>`).
    *   Render Action Form:
        *   Textarea for `notes` (append only or editable).
        *   Select for `status` (`info`, `open`, `resolved`).
    *   **API Logic**: On PATCH, if status changes to `resolved`, automatically set `resolvedAt = Date.now()`, `resolvedBy = locals._user.id`, and `resolvedByName = locals._user.name`.

### Step 5: Sidebar Integration
*   **File**: `src/lib/components/Sidebar.svelte` (or `+layout.server.ts` to pass the count)
*   **Task**: Add `{ id: 9, title: 'Incydenty', icon: 'alert-triangle', link: '/incidents' }` to the menu.
*   **Task**: Fetch the count of `status == 'open'` incidents and display a `<span class="badge bg-danger">` if count > 0.
