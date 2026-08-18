<script lang="ts">
	import type { Readable } from 'svelte/store';
	import { DataHandler, Datatable, Th, ThFilter, type Row } from '@vincjo/datatables';
	import ThRange from '$lib/misc/ThRange.svelte';
	import { onMount, untrack } from 'svelte';
	import { browser } from '$app/environment';
	import Spinner from './Spinner.svelte';
	import { fade } from 'svelte/transition';
	import plTimezone from '$lib/utils/tz';
	import type { Snippet } from 'svelte';

	const tableCaptions = {
		search: 'Szukaj...',
		show: 'Pokaż',
		entries: 'wpisów',
		filter: 'Filtruj',
		rowCount: 'Pokazuję od {start} do {end} wśród {total} wpisów',
		noRows: 'Brak wyników',
		previous: 'Poprzednie',
		next: 'Następne'
	};

	type T = $$Generic;
	interface Props {
		data: (T & Row)[] | undefined;
		handler?: DataHandler | null;
		rows?: Readable<T[]> | null;
		loaded?: boolean;
		headers: SvelteCustom.DatatableHeaders;
		filters?: SvelteCustom.DatatableRangeFilter;
		noActionRow?: boolean;
		class?: string;
		hideSearch?: boolean;
		hasTimestamp?: boolean;
		row: Snippet<[T]>;
	}

	let { data, handler = $bindable(null), rows = $bindable(null), loaded = $bindable(false), headers, filters = $bindable(headers), noActionRow = false, class: addClass = '', hideSearch = false, hasTimestamp = false, row: rowSnippet }: Props = $props();

	type TimestampedGenericRow = T &
		Row & {
			date: string;
			timestamp: number;
		};

	const render = async () => {
		if (!data) return;
		if (data.length === 0) return (loaded = true);

		if (hasTimestamp) {
			const colIndex = headers.findIndex((column) => column[0] === 'timestamp');
			if (colIndex >= 0) {
				filters = [ ...headers ];
				filters[colIndex] = [ 'date', 'Data' ];
				for (const row of data as TimestampedGenericRow[]) {
					if (!row.date) row.date = plTimezone(row.timestamp);
				}
			}
		}

		if (handler) return handler.setRows(data);
		handler = new DataHandler(data, { rowsPerPage: 50, i18n: tableCaptions });
		rows = handler.getRows();
		setTimeout(() => {
			loaded = true;
		}, 100);
	};

	$effect(() => {
		const currentData = data;
		untrack(() => {
			if (!currentData) return;

			if (currentData.length === 0) {
				loaded = true;
				return;
			}

			if (hasTimestamp) {
				const colIndex = headers.findIndex((column) => column[0] === 'timestamp');
				if (colIndex >= 0) {
					filters = [ ...headers ];
					filters[colIndex] = [ 'date', 'Data' ];
					for (const row of data as TimestampedGenericRow[]) {
						if (!row.date) row.date = plTimezone(row.timestamp);
					}
				}
			}

			if (handler) {
				handler.setRows(currentData);
			} else {
				handler = new DataHandler(currentData, { rowsPerPage: 50, i18n: tableCaptions });
				rows = handler.getRows();
			}

			setTimeout(() => {
				loaded = true;
			}, 100);
		});
	});

	onMount(() => {
		render();
	});
</script>

<div class="position-relative datatable">
	{#if loaded && data && data.length && handler}
		<Datatable {handler} search={!hideSearch} rowsPerPage={!hideSearch} rowCount={!hideSearch} pagination={!hideSearch}>
			<table class="table table-striped {addClass}" class:noActionRow>
				<thead>
					<tr>
						{#if !noActionRow}
							<th style="background: inherit; padding: 8px 20px; white-space: nowrap; font-size: 13px; user-select: none; border-bottom: 1px solid #e0e0e0;"><strong>Akcje</strong></th>
						{/if}
						{#each headers as [ orderBy, caption ]}
							<Th {handler} {orderBy}>{caption}</Th>
						{/each}
					</tr>
					<tr class="filterRow">
						{#if !noActionRow}
							<th></th>
						{/if}
						{#each filters as [ filterBy, options ]}
							{#if typeof options === 'object'}
								<ThRange {handler} {filterBy} min={options.min} max={options.max} />
							{:else}
								<ThFilter {handler} {filterBy} />
							{/if}
						{/each}
					</tr>
				</thead>
				<tbody>
					{#if browser && rows && $rows}
						{#each $rows as row (row)}
							<tr out:fade={{ duration: 250 }}>
								{@render rowSnippet?.(row)}
							</tr>
						{/each}
					{/if}
				</tbody>
			</table>
		</Datatable>
	{:else if loaded && Array.isArray(data)}
		<h3 class="flex-center p-3 my-3 position-absolute top-0 w-100 h-100 left-0 z-index-2" transition:fade={{ duration: 500 }}>Brak danych</h3>
	{:else}
		<div class="flex-center p-3 my-3 position-absolute top-0 w-100 h-100 left-0 z-index-2" transition:fade={{ duration: 500 }}>
			<Spinner />
		</div>
	{/if}
</div>
