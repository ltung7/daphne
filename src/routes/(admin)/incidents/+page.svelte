<script lang="ts">
	import { onMount } from 'svelte';
	import { internal } from '$lib/nav/internal';
	import DatatableWrapper from '$lib/misc/DatatableWrapper.svelte';
	import PageTitle from '$lib/misc/PageTitle.svelte';
	import TooltipSquareIconLink from '$lib/misc/TooltipSquareIconLink.svelte';
	import IconButton from '$lib/misc/IconButton.svelte';
	import IconLink from '$lib/misc/IconLink.svelte';
	import IncidentCategoryBadge from '$lib/components/incident/IncidentCategoryBadge.svelte';
	import IncidentSourceBadge from '$lib/components/incident/IncidentSourceBadge.svelte';
	import IncidentSeverityBadge from '$lib/components/incident/IncidentSeverityBadge.svelte';
	import IncidentStatusBadge from '$lib/components/incident/IncidentStatusBadge.svelte';

	let incidents: App.Incident.IncidentLog[] = $state([]);
	let isLoading = $state(true);
	let isLoadingMore = $state(false);
	let hasMore = $state(true);

	const now = Date.now();
	const defaultFrom = now - 7 * 24 * 60 * 60 * 1000;

	let fromDate = $state(new Date(defaultFrom).toISOString().slice(0, 10));
	let toDate = $state(new Date(now).toISOString().slice(0, 10));
	let severity = $state('');
	let status = $state('');
	let category = $state('');
	let source = $state('');

	async function loadData(append = false) {
		if (append) {
			isLoadingMore = true;
		} else {
			isLoading = true;
			hasMore = true;
			if (!append) incidents = [];
		}

		try {
			const fromTime = new Date(fromDate).getTime();
			const toTime = new Date(toDate).getTime() + 24 * 60 * 60 * 1000 - 1;

			const dataParams: Record<string, any> = {
				from: fromTime.toString(),
				to: toTime.toString()
			};

			if (severity) dataParams.severity = severity;
			if (status) dataParams.status = status;
			if (category) dataParams.category = category;
			if (source) dataParams.source = source;

			if (append && incidents.length > 0) {
				const lastIncident = incidents[incidents.length - 1];
				dataParams.cursor = lastIncident.timestamp;
			}

			const response = await internal.getApi(dataParams);

			if (response?.incidents) {
				if (append) {
					incidents = [ ...incidents, ...response.incidents ];
				} else {
					incidents = response.incidents;
				}

				if (response.incidents.length < 50) {
					hasMore = false;
				}
			}
		} catch (error) {
			console.error('Error loading incidents:', error);
		} finally {
			isLoading = false;
			isLoadingMore = false;
		}
	}

	onMount(() => {
		loadData(false);
	});

	function applyFilters() {
		loadData(false);
	}

	function resetFilters() {
		fromDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
		toDate = new Date(Date.now()).toISOString().slice(0, 10);
		severity = '';
		status = '';
		category = '';
		source = '';
		loadData(false);
	}

	function loadMore() {
		loadData(true);
	}

	const headers: SvelteCustom.DatatableHeaders = [
		[ 'timestamp', 'Data' ],
		[ 'title', 'Tytuł' ],
		[ 'severity', 'Priorytet' ],
		[ 'status', 'Status' ],
		[ 'category', 'Kategoria' ],
		[ 'source', 'Źródło' ]
	];
</script>

<PageTitle title="Zdarzenia" subtitle="Zgłoszone problemy i wydarzenia" onDataLoaded={(response) => incidents = response.incidents}>
	<IconLink href="/incidents/matrix" caption="Matryca odpowiedzialności" icon="table" />
</PageTitle>

<div class="card mb-3">
	<div class="card-body">
		<div class="row">
			<div class="col-md-6 col-lg-4 col-xl-2">
				<label for="fromDate" class="form-label">Od</label>
				<input type="date" class="form-control" id="fromDate" bind:value={fromDate} />
			</div>
			<div class="col-md-6 col-lg-4 col-xl-2">
				<label for="toDate" class="form-label">Do</label>
				<input type="date" class="form-control" id="toDate" bind:value={toDate} />
			</div>
			<div class="col-md-6 col-lg-4 col-xl-2">
				<label for="severity" class="form-label">Priorytet</label>
				<select class="form-select" id="severity" bind:value={severity}>
					<option value="">Wszystkie</option>
					<option value="low">Low</option>
					<option value="medium">Medium</option>
					<option value="high">High</option>
					<option value="critical">Critical</option>
				</select>
			</div>
			<div class="col-md-6 col-lg-4 col-xl-2">
				<label for="status" class="form-label">Status</label>
				<select class="form-select" id="status" bind:value={status}>
					<option value="">Wszystkie</option>
					<option value="info">Info</option>
					<option value="open">Open</option>
					<option value="resolved">Resolved</option>
				</select>
			</div>
			<div class="col-md-6 col-lg-4 col-xl-2">
				<label for="category" class="form-label">Kategoria</label>
				<select class="form-select" id="category" bind:value={category}>
					<option value="">Wszystkie</option>
					<option value="safety">Safety</option>
					<option value="platform_account">Platform Account</option>
					<option value="compliance">Compliance</option>
					<option value="driver_conduct">Driver Conduct</option>
					<option value="vehicle_issue">Vehicle Issue</option>
					<option value="data_sync">Data Sync</option>
					<option value="financial">Financial</option>
				</select>
			</div>
			<div class="col-md-6 col-lg-4 col-xl-2 pt-2 pt-xl-0">
				<IconButton class="mb-2 w-100 flex-center" caption="Filtruj" icon="filter" size={6} onclick={applyFilters} />
				<IconButton class="mb-0 w-100 flex-center" caption="Resetuj" icon="rotate-left" size={6} outline onclick={resetFilters} />
			</div>
		</div>
	</div>
</div>

<div class="card">
	<div class="card-body p-0">
		<DatatableWrapper data={incidents} loaded={!isLoading} {headers} hasTimestamp>
			{#snippet row(incident)}
				<td class="py-1">
					<TooltipSquareIconLink icon="link" hoverText="Pokaż szczegóły" href="/incidents/{incident.id}" size={5} />
				</td>
				<td class="text-nowrap py-1">
					{new Date(incident.timestamp).toLocaleString()}
				</td>
				<td class="fw-bold py-1">
					{incident.title}
				</td>
				<td class="py-1 text-center">
					<IncidentSeverityBadge severity={incident.severity} small />
				</td>
				<td class="py-1 text-center">
					<IncidentStatusBadge status={incident.status} small />
				</td>
				<td class="py-1 text-center">
					<IncidentCategoryBadge category={incident.category} small />
				</td>
				<td class="py-1 text-center">
					<IncidentSourceBadge source={incident.source} small />
				</td>
			{/snippet}
		</DatatableWrapper>

		{#if incidents.length > 0 && hasMore}
			<div class="p-3 text-center border-top">
				<button class="btn btn-outline-primary" onclick={loadMore} disabled={isLoadingMore}>
					{isLoadingMore ? 'Ładowanie...' : 'Pokaż starsze (50)'}
				</button>
			</div>
		{/if}
	</div>
</div>
