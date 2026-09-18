<script lang="ts">
	import { untrack } from 'svelte';
	import type { PageProps } from './$types';
	import { vehicleDocumentNames, updatableVehicleVariables } from '$lib/assets/constants';
	import UploadVehicleDatafiles from '$lib/form/UploadVehicleDatafiles.svelte';
	import plTimezone from '$lib/utils/tz';
	import TooltipSquareIconLink from '$lib/misc/TooltipSquareIconLink.svelte';
	import type { VehicleDocumentResult } from '$lib/datafiles/vehicle';
	import { confirmSuccess, internal } from '$lib/nav/internal';
	import IconButton from '$lib/misc/IconButton.svelte';
	import NewHandoverProtocol from '$lib/components/documents/NewHandoverProtocol.svelte';
	import { fly } from 'svelte/transition';
	import SectionCard from '$lib/misc/SectionCard.svelte';
	import VehicleImageAndData from '$lib/components/vehicle/VehicleImageAndData.svelte';
	import PageTitle from '$lib/misc/PageTitle.svelte';
	import PageTopActions from '$lib/misc/PageTopActions.svelte';
	import VehicleStatusChanger from '$lib/components/vehicle/VehicleStatusChanger.svelte';
	import VehicleStatusHistory from '$lib/components/vehicle/VehicleStatusHistory.svelte';

	let { data }: PageProps = $props();
	let vehicle: Vehicle.Vehicle = $state(untrack(() => data.vehicle));
	let documents: Vehicle.VehicleDocument[] = $state(untrack(() => data.documents));
	let handoverModal: boolean = $state(false);

	const onFinished = (doc: Vehicle.VehicleDocument) => {
		if (documents.find((d) => d.id !== doc.id)) documents.push(doc);
		if (doc.type === 'vehicle_photo_exterior' && !vehicle.imageUrl?.length) {
			internal.postApi({ imageUrl: doc.url }, 'patch');
			vehicle.imageUrl = doc.url;
		}
	};

	const onProcessed = (result: VehicleDocumentResult) => {
		let hasUpdates = false;
		const updateItems: Partial<Vehicle.Vehicle> = {};

		for (const key of updatableVehicleVariables) {
			if (!(key in result)) continue;

			// @ts-expect-error type mismatch
			const value = result[key as keyof Vehicle.Vehicle];
			if (typeof value === 'undefined') continue;
			if (typeof value === 'string' && value.length === 0) continue;
			if (value === vehicle[key]) continue;

			hasUpdates = true;
			updateItems[key] = value;
		}

		if (hasUpdates) {
			confirmSuccess(internal.postApi(updateItems, 'patch')).then(() => {
				Object.assign(vehicle, updateItems);
			});
		}
	};

	const onstatuschanged = (status: Vehicle.Status) => {
		vehicle.status = status;
	};
</script>

<PageTitle title="Dane pojazdu {vehicle.registrationNumber}" subtitle="Szczególy pojazdu" />

<PageTopActions>
	<VehicleStatusChanger {vehicle} type={data.type} {documents} {onstatuschanged} />
</PageTopActions>

<!-- <div class="card card-body mb-3">
	<div class="d-flex">
	{#if vehicle && data.type && vehicle.status === 'precheck'}
		<PrecheckVerification {vehicle} type={data.type} {documents} />
	{/if}
	{#if vehicle.status !== 'precheck'}
		<IconButton caption="Zmień status" size={6} />
	{/if}
	</div>
</div> -->

<SectionCard title="Dane pojazdu">
	<VehicleImageAndData {vehicle} />
</SectionCard>

{#if vehicle.status !== 'precheck'}
	<SectionCard title="Kierowca">
		{#if vehicle.assignedDriverId}
			Przypisano do <a href="/drivers/{vehicle.assignedDriverId}">{vehicle.assignedDriverName}</a>
		{:else}
			<div class="flex-center flex-column">
				<div class="mb-3">Nie przypisano żadnego pojazdu</div>
				<IconButton icon="search" caption="Przypisz" onclick={() => (handoverModal = true)} size={6} />
			</div>
		{/if}
	</SectionCard>
	
	<VehicleStatusHistory registrationNumber={vehicle.registrationNumber} />
{/if}

<SectionCard title="Dokumenty">
	{#snippet cta()}
		<UploadVehicleDatafiles {onFinished} {onProcessed} registrationNumber={vehicle.registrationNumber} />
	{/snippet}
	
	{#if documents?.length}
		<ul class="list-group">
			{#each documents as doc}
				<li class="list-group-item flex-between">
					<div>
						<div class="text-muted xsmall">{vehicleDocumentNames[doc.type]} ({plTimezone(doc.timestamp)})</div>
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

{#if handoverModal}
	<div class="position-fixed w-100 h-100 top-0 start-0 overflow-auto px-3 pb-3" style="z-index: 10" transition:fly>
		<NewHandoverProtocol {vehicle} />
	</div>
{/if}
