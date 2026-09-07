<script lang="ts">
	import { untrack } from 'svelte';
	import type { PageProps } from './$types';
	import EditNotesCard from '$lib/form/EditNotesCard.svelte';
	import plTimezone, { formatTimezone } from '$lib/utils/tz';
	import UploadDriverDatafiles from '$lib/form/UploadDriverDatafiles.svelte';
	import TooltipSquareIconLink from '$lib/misc/TooltipSquareIconLink.svelte';
	import { driverDocumentNames } from '$lib/assets/constants';
	import DriverVerification from '$lib/components/DriverVerification.svelte';
	import NewHandoverProtocol from '$lib/components/documents/NewHandoverProtocol.svelte';
	import IconButton from '$lib/misc/IconButton.svelte';
	import { fly } from 'svelte/transition';
	import PageTitle from '$lib/misc/PageTitle.svelte';
	import SectionCard from '$lib/misc/SectionCard.svelte';
	import DriverImageAndData from '$lib/components/driver/DriverImageAndData.svelte';
	import PageTopActions from '$lib/misc/PageTopActions.svelte';

	let { data }: PageProps = $props();
	let driver: Driver.Driver = $state(untrack(() => data.driver));
	let documents: Driver.DriverDocument[] = $state(untrack(() => data.documents));
	let handoverModal: boolean = $state(false);

	const onFinished = (doc: Driver.DriverDocument) => {
		if (documents.find((d) => d.id !== doc.id)) documents.push(doc);
	};
</script>

<PageTitle title=">Dane kierowcy {driver.name}" subtitle="Szczególy zarejestrowanego kierowcy" />

<PageTopActions>
	{#if driver && driver.status === 'pending_verification'}
		<DriverVerification {driver} {documents} />
	{/if}
	{#if driver.status !== 'pending_verification'}
		<IconButton caption="Zmień status" size={6} />
	{/if}
</PageTopActions>

<SectionCard title="Dane kierowcy">
	<DriverImageAndData {driver} />
</SectionCard>

{#if driver.status !== 'pending_verification'}
	<SectionCard title="Kierowca">
		{#if driver.assignedVehicle}
			<a class="flex-center flex-column" href="/vehicles/{driver.assignedVehicle.registrationNumber}">
				{#if driver.assignedVehicle.imageUrl}
					<img src={driver.assignedVehicle.imageUrl} alt={driver.assignedVehicle.model} style="max-height: 200px;" />
				{/if}
				<h6>{driver.assignedVehicle.registrationNumber}</h6>
				<div class="text-muted small">Od {formatTimezone(driver.assignedVehicle.timestamp)}</div>
			</a>
		{:else}
			<div class="flex-center flex-column">
				<div class="mb-3">Nie przypisano żadnego pojazdu</div>
				<IconButton icon="search" caption="Przypisz" onclick={() => (handoverModal = true)} size={6} />
			</div>
		{/if}
	</SectionCard>
{/if}

<SectionCard title="Dokumenty">
	{#snippet cta()}
		<UploadDriverDatafiles {onFinished} driverId={driver.id} />
	{/snippet}

	{#if documents?.length}
		<ul class="list-group">
			{#each documents as doc}
				<li class="list-group-item flex-between">
					<div>
						<div class="text-muted xsmall">{driverDocumentNames[doc.type]} ({plTimezone(doc.timestamp)})</div>
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

<EditNotesCard bind:notes={driver.notes} />

{#if handoverModal}
	<div class="position-fixed w-100 h-100 top-0 start-0 overflow-auto px-3 pb-3" style="z-index: 10" transition:fly>
		<NewHandoverProtocol {driver} />
	</div>
{/if}
