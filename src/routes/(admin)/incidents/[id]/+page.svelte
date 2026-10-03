<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import type { PageData } from './$types';
	import PageTitle from '$lib/misc/PageTitle.svelte';
	import SectionCard from '$lib/misc/SectionCard.svelte';
	import { internal, confirmSuccess } from '$lib/nav/internal';
	import EditNotesCard from '$lib/form/EditNotesCard.svelte';
	import IncidentMetadata from './IncidentMetadata.svelte';
	import PageTopActions from '$lib/misc/PageTopActions.svelte';
	import IconButton from '$lib/misc/IconButton.svelte';
	import Spinner from '$lib/misc/Spinner.svelte';
	import IncidentCategoryBadge from '$lib/components/incident/IncidentCategoryBadge.svelte';
	import IncidentSourceBadge from '$lib/components/incident/IncidentSourceBadge.svelte';
	import IncidentSeverityBadge from '$lib/components/incident/IncidentSeverityBadge.svelte';
	import IncidentStatusBadge from '$lib/components/incident/IncidentStatusBadge.svelte';

	let { data }: { data: PageData } = $props();

	let incident = $derived(data.incident);

	let notes = $state('');
	let status = $state('');
	let isSaving = $state(false);

	$effect(() => {
		notes = incident.notes || '';
		status = incident.status;
	});

	function setResolved() {
		status = 'resolved';
		saveChanges();
	}

	async function saveChanges() {
		isSaving = true;
		await confirmSuccess(internal.postApi({ notes, status }, 'patch'));
		await invalidateAll();
		isSaving = false;
	}
</script>

<PageTitle title={incident.title} subtitle="Szczegóły incydentu" back="/incidents" />

{#if status === 'open'}
	<PageTopActions>
		{#if isSaving}
			<Spinner size="34px" />
		{:else}
			<IconButton size={6} icon="checkbox" caption="Oznacz jako rozwiązane" color="success" onclick={setResolved} />
		{/if}
	</PageTopActions>
{/if}

<SectionCard title="Opis">
	<p class="mb-0 fs-5 text-dark" style="white-space: pre-wrap;">{incident.description}</p>
</SectionCard>

<SectionCard title="Szczegóły">
	<div class="row">
		<div class="col-12 col-md-6 col-lg-3 flex-center flex-column mb-3">
			<strong>Kategoria:</strong>
			<IncidentCategoryBadge category={incident.category} />
		</div>
		<div class="col-12 col-md-6 col-lg-3 flex-center flex-column mb-3">
			<strong>Źródło:</strong>
			<IncidentSourceBadge source={incident.source} />
		</div>
		<div class="col-12 col-md-6 col-lg-3 flex-center flex-column mb-3">
			<strong>Krytyczność:</strong>
			<IncidentSeverityBadge severity={incident.severity} />
		</div>
		<div class="col-12 col-md-6 col-lg-3 flex-center flex-column mb-3">
			<strong>Status:</strong>
			<IncidentStatusBadge status={incident.status} />
		</div>
	</div>
	<div class="row">
		<div class="col-12 col-md-6 mt-3">
			<ul class="list-unstyled mb-0">
				<li class="mb-2"><strong>Data zgłoszenia:</strong> <br /> {new Date(incident.timestamp).toLocaleString()}</li>
			</ul>
		</div>
		<div class="col-12 col-md-6 mt-3">
			<ul class="list-unstyled mb-0">
				{#if incident.resolvedAt}
					<li class="mb-2"><strong>Rozwiązano:</strong> <br /> {new Date(incident.resolvedAt).toLocaleString()}</li>
					<li class="mb-2"><strong>Rozwiązane przez:</strong> <br /> {incident.resolvedByName || 'Nieznany'}</li>
				{/if}
			</ul>
		</div>
	</div>
</SectionCard>

<IncidentMetadata metadata={incident.metadata} />

<EditNotesCard bind:notes={incident.notes} onChange={saveChanges} />
