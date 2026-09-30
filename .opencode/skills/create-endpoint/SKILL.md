---
name: create-endpoint
description: Guidelines for creating new admin endpoints and standard CRUD pages in this SvelteKit application. Use this skill when asked to create a new admin endpoint, list view, detail view, or create view for a specific data model.
---

# Create Endpoint

This skill provides guidelines and templates for creating new admin endpoints (list, detail, and create views) in this SvelteKit application.

## Context
Admin endpoints follow a consistent directory and API structure. They rely on standardized components for data tables, forms, and detail views. Each entity generally requires a List view, a Detail view, and a Create view. 

## Instructions for Creating a New Endpoint

When asked to create an endpoint for a new entity, use the following templates and steps. 
*Note: Replace `{Endpoint}` with the PascalCase entity name (e.g., `Vehicle`), `{EndpointPlural}` with PascalCase plural (e.g., `Vehicles`), `{endpoint}` with camelCase (e.g., `vehicle`), and `{endpointPlural}` with camelCase plural (e.g., `vehicles`).*

### 1. Scaffold Route Structure

Create the following directory and file structure under `src/routes/(admin)/{endpoint}/`:

```
src/routes/(admin)/{endpoint}/
├── +page.svelte              # List view
├── api/
│   └── +server.ts            # GET list API endpoint
├── [id]/
│   ├── +page.svelte          # Detail view
│   ├── +page.server.ts       # Server load for detail
│   └── api/
│       └── +server.ts        # PATCH/POST detail API endpoint
└── new/
    ├── +page.svelte          # Create view
    └── api/
        └── +server.ts        # POST create API endpoint
```

### 2. Required Supporting Files

Before building the UI, ensure the core types, constants, and database functions exist:

1. **Type definitions** (`src/app.d.ts` or `src/lib/types/{endpoint}.ts`):
   - `{Endpoint}` interface
   - `New{Endpoint}Data` interface
   - `{Endpoint}Document` interface (if applicable)

2. **Clean item** (`src/lib/assets/cleanItems.ts`):
   ```typescript
   export const clean{Endpoint}: New{Endpoint}Data = { /* default values */ };
   ```

3. **Zod schema** (`src/lib/assets/zodschemas/new{endpoint}.zod.ts`):
   ```typescript
   export const new{Endpoint}DataSchema = z.object({ /* validation */ });
   ```

4. **Database functions** (`src/lib/server/db/firebase/{endpoint}.fdb.ts`):
   - `find{EndpointPlural}()`
   - `get{Endpoint}(id)`
   - `update{Endpoint}(id, data)`
   - `addNew{Endpoint}(data)` (often in a `.service.ts` file instead)

5. **API Fetch function** (`src/lib/nav/fetchData.ts`):
   ```typescript
   export const fetch{EndpointPlural} = () => internal.getApi({}).then(r => r.{endpointPlural});
   ```

6. **Shared Components** (`src/lib/components/{endpoint}/`):
   - `{Endpoint}Status.svelte`, `{Endpoint}StatusChanger.svelte`, `{Endpoint}StatusHistory.svelte`
   - `{Endpoint}ImageAndData.svelte`
   - `{Endpoint}Form.svelte`

### 3. Implement List View

**List Page (`src/routes/(admin)/{endpoint}/+page.svelte`)**
```svelte
<script lang="ts">
	import DatatableWrapper from '$lib/misc/DatatableWrapper.svelte';
	import { onMount } from 'svelte';
	import TooltipSquareIconLink from '$lib/misc/TooltipSquareIconLink.svelte';
	import { fetch{EndpointPlural} } from '$lib/nav/fetchData';
	import {StatusComponent} from '$lib/components/{endpoint}/{StatusComponent}.svelte';
	import PageTitle from '$lib/misc/PageTitle.svelte';
	import IconLink from '$lib/misc/IconLink.svelte';

	let items: {Endpoint}.{Endpoint}[] = $state([]);
	let loaded = $state(false);

	const loadItems = () => {
		fetch{EndpointPlural}().then((list) => {
			items = list;
			loaded = true;
		});
	};

	const headers: SvelteCustom.DatatableHeaders<keyof {Endpoint}.{Endpoint}> = [
		[ 'id', 'ID' ],
		[ 'name', 'Nazwa' ],
		[ 'status', 'Status' ],
		// ... other fields
	];

	onMount(loadItems);
</script>

<PageTitle title="{EndpointPlural}" subtitle="Lista {endpointPlural}">
	<IconLink icon="add" caption="Nowy {endpoint}" href="/{endpoint}/new" />
</PageTitle>

<div class="card">
	<div class="card-body text-center p-0">
		<DatatableWrapper {loaded} data={items} {headers}>
			{#snippet row(row)}
				<td class="py-1">
					<TooltipSquareIconLink icon="link" hoverText="Pokaż szczegóły" href="/{endpoint}/{row.id}" size={5} />
				</td>
				<td>{row.name}</td>
				<td class="py-1"><StatusComponent status={row.status} /></td>
				<!-- ... other columns -->
			{/snippet}
		</DatatableWrapper>
	</div>
</div>
```

**List API (`src/routes/(admin)/{endpoint}/api/+server.ts`)**
```typescript
import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { find{EndpointPlural} } from "$lib/server/db/firebase/{endpoint}.fdb";
import { isDev } from "$lib/utils/isDev";

export const GET: RequestHandler = async ({ url, setHeaders }) => {
	let fields: (keyof {Endpoint}.{Endpoint})[] | false = false;
	if (url.searchParams.get('fields')) {
		fields = url.searchParams.get('fields')!.split(',') as (keyof {Endpoint}.{Endpoint})[];
	}
	const items = await find{EndpointPlural}(false, fields);
	if (isDev) {
		setHeaders({ "cache-control": "max-age=60000" });
	} else {
		setHeaders({ "cache-control": "max-age=300" });
	}
	return json({ success: true, items })
};
```

### 4. Implement Detail View

**Detail Server Load (`src/routes/(admin)/{endpoint}/[id]/+page.server.ts`)**
```typescript
import { get{Endpoint} } from '$lib/server/db/firebase/{endpoint}.fdb';
import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { find{Endpoint}Documents } from '$lib/server/db/firebase/{endpoint}Documents.fdb';

export const load = (async ({ params }) => {
	const item = await get{Endpoint}(params.id);
	if (!item) throw error(404, '{Endpoint} not found');
	const documents = await find{Endpoint}Documents({ {endpoint}Id: item.id });
	return { {endpoint}: item, documents }
}) satisfies PageServerLoad;
```

**Detail Page (`src/routes/(admin)/{endpoint}/[id]/+page.svelte`)**
```svelte
<script lang="ts">
	import { untrack } from 'svelte';
	import type { PageProps } from './$types';
	import EditNotesCard from '$lib/form/EditNotesCard.svelte';
	import Upload{Endpoint}Datafiles from '$lib/form/Upload{Endpoint}Datafiles.svelte';
	import TooltipSquareIconLink from '$lib/misc/TooltipSquareIconLink.svelte';
	import IconButton from '$lib/misc/IconButton.svelte';
	import SectionCard from '$lib/misc/SectionCard.svelte';
	import {Endpoint}ImageAndData from '$lib/components/{endpoint}/{Endpoint}ImageAndData.svelte';
	import PageTitle from '$lib/misc/PageTitle.svelte';
	import PageTopActions from '$lib/misc/PageTopActions.svelte';
	import {Endpoint}StatusChanger from '$lib/components/{endpoint}/{Endpoint}StatusChanger.svelte';
	import {Endpoint}StatusHistory from '$lib/components/{endpoint}/{Endpoint}StatusHistory.svelte';
	import { Offcanvas } from '@sveltestrap/sveltestrap';
	import {Endpoint}Form from '$lib/components/{endpoint}/{Endpoint}Form.svelte';

	let { data }: PageProps = $props();
	let item: {Endpoint}.{Endpoint} = $state(untrack(() => data.{endpoint}));
	let documents: {Endpoint}.{Endpoint}Document[] = $state(untrack(() => data.documents));
	let editModal: boolean = $state(false);

	const onFinished = (doc: {Endpoint}.{Endpoint}Document) => {
		if (documents.find((d) => d.id !== doc.id)) documents.push(doc);
	};

	const handleItemUpdate = (response: any, updatedItem: {Endpoint}.{Endpoint}) => {
		if (response?.success) {
			Object.assign(item, updatedItem);
			data.{endpoint} = { ...item };
		}
		editModal = false;
	};

	const toggle = () => { editModal = !editModal }
</script>

{#snippet footerSnippet()}
	<div class="d-flex justify-content-end gap-2">
		<IconButton icon="cross-circle" caption="Zamknij" onclick={() => (editModal = false)} outline color="dark" size={6} class="mb-0 me-2" />
	</div>
{/snippet}

<PageTitle title="Dane {endpoint} {item.name}" subtitle="Szczegóły {endpoint}" back="/{endpoint}" />

<PageTopActions>
	<{Endpoint}StatusChanger bind:item {documents} />
	<IconButton class="ms-auto mb-0" icon="edit" caption="Edytuj" onclick={() => (editModal = true)} size={6} />
</PageTopActions>

<SectionCard title="Dane {endpoint}">
	{#snippet cta()}
		<{Endpoint}StatusHistory {endpoint}Id={item.id} />
	{/snippet}
	<{Endpoint}ImageAndData {item} />
</SectionCard>

<SectionCard title="Dokumenty">
	{#snippet cta()}
		<Upload{Endpoint}Datafiles {onFinished} {endpoint}Id={item.id} />
	{/snippet}

	{#if documents?.length}
		<ul class="list-group">
			{#each documents as doc}
				<li class="list-group-item flex-between">
					<div>
						<div class="fw-bold text-dark">{doc.name}</div>
					</div>
					<TooltipSquareIconLink class="me-n2" href={doc.url} download icon="cloud-download-alt" hoverText="Pobierz" blank />
				</li>
			{/each}
		</ul>
	{:else}
		Brak dodanych dokumentów
	{/if}
</SectionCard>

<EditNotesCard bind:notes={item.notes} />

<Offcanvas bind:isOpen={editModal} class="w-100" placement="end" header="Edytuj {endpoint}" {toggle}>
	<{Endpoint}Form bind:item cleanItem={untrack(() => data.{endpoint})} onResponse={handleItemUpdate} patch footer={footerSnippet} />
</Offcanvas>
```

**Detail API (`src/routes/(admin)/{endpoint}/[id]/api/+server.ts`)**
```typescript
import type { RequestHandler } from "./$types";
import { update{Endpoint} } from "$lib/server/db/firebase/{endpoint}.fdb";
import { json, error } from "@sveltejs/kit";

const ALLOWED_UPDATE_FIELDS = [
	'name',
	'status',
	'notes',
	// ... other updatable fields
] as const;

type AllowedUpdateField = typeof ALLOWED_UPDATE_FIELDS[number];

export const PATCH: RequestHandler = async ({ params, request }) => {
	const { data } = await request.json();
	
	const filteredData: Partial<Record<AllowedUpdateField, unknown>> = {};
	
	for (const key of ALLOWED_UPDATE_FIELDS) {
		if (key in data) {
			filteredData[key] = data[key];
		}
	}
	
	if (Object.keys(filteredData).length === 0) {
		return error(400, { message: 'No valid fields provided for update' });
	}
	
	await update{Endpoint}(params.id, filteredData as Parameters<typeof update{Endpoint}>[1]);
	
	return json({ success: true, updatedFields: Object.keys(filteredData) });
};
```

### 5. Implement Create View

**Create Page (`src/routes/(admin)/{endpoint}/new/+page.svelte`)**
```svelte
<script lang="ts">
	import { clean{Endpoint} } from '$lib/assets/cleanItems';
	import { onMount } from 'svelte';
	import PageTitle from '$lib/misc/PageTitle.svelte';
	import ClosableModal from '$lib/misc/ClosableModal.svelte';
	import { goto } from '$app/navigation';
	import {Endpoint}Form from '$lib/components/{endpoint}/{Endpoint}Form.svelte';
	import { new{Endpoint}DataSchema } from '$lib/assets/zodschemas/new{endpoint}.zod';

	let item: {Endpoint}.New{Endpoint}Data = $state({ ...clean{Endpoint} });
	let createdId: string | undefined = $state();
	let showCreated = $state(false);
	let formRef: ReturnType<typeof {Endpoint}Form> | undefined = $state();

	const onResponse = async (response: any) => {
		if (response.id) createdId = response.id;
		showCreated = true;
	};

	const onReset = () => {
		if (formRef) {
			// Reset form specific logic
		}
	};

	onMount(() => {
		setTimeout(onReset, 0);
	});
</script>

<PageTitle title="Nowy {endpoint}" subtitle="Wprowadź dane nowego {endpoint} do systemu" back="/{endpoint}" />

<{Endpoint}Form bind:item bind:this={formRef} cleanItem={clean{Endpoint}} {onResponse} {onReset} schema={new{Endpoint}DataSchema} />

<ClosableModal bind:isOpen={showCreated} headerText="{Endpoint} dodany" buttonCaption={createdId?.length ? 'Przejdź' : false} onClick={() => createdId && goto('/{endpoint}/' + createdId)} centered>
	<div class="text-center">
		<h5 class="text-success">{Endpoint} został dodany</h5>
	</div>
</ClosableModal>
```

**Create API (`src/routes/(admin)/{endpoint}/new/api/+server.ts`)**
```typescript
import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { addNew{Endpoint} } from "$lib/server/services/{endpoint}.service";

export const POST: RequestHandler = async ({ request }) => {
	const { data } = await request.json();
	const { id } = await addNew{Endpoint}(data);
	return json({ success: true, id })
};
```

### 6. Key Conventions Recap

- Use **Svelte 5 runes**: `$props()`, `$state()`, `$derived()`, and snippets (`{#snippet row()}`).
- Use `untrack()` for initial component state assignments from `data` props.
- User-facing strings must be in Polish. *(Or localized with Paraglide, depending on project setup)*
- API responses must follow the `{ success: true, ... }` shape.
- Throw appropriate errors from SvelteKit API routes: `error(404, 'message')` or `error(400, { message })`.
- Use the allowlist pattern (`ALLOWED_UPDATE_FIELDS`) for all PATCH operations.
- Data table components use `$lib/misc/DatatableWrapper.svelte`.
- Loading and Success handling wrappers exist in `$lib/nav/loader` (`wrapLoader(promise)`) and `$lib/nav/internal` (`confirmSuccess(promise, 'message')`).
