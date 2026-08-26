<script lang="ts">
	import { untrack } from 'svelte';
	import type { PageProps } from './$types';
	import { fuelNames, vehicleDocumentNames, updatableVehicleVariables } from '$lib/assets/constants';
	import { formatCurrency } from '$lib/utils/numberFormatter';
	import VehicleStatus from '$lib/misc/VehicleStatus.svelte';
	import UploadVehicleDatafiles from '$lib/form/UploadVehicleDatafiles.svelte';
	import PrecheckVerification from '$lib/components/PrecheckVerification.svelte';
	import plTimezone from '$lib/utils/tz';
	import TooltipSquareIconLink from '$lib/misc/TooltipSquareIconLink.svelte';
	import type { VehicleDocumentResult } from '$lib/datafiles/vehicle';
	import { confirmSuccess, internal } from '$lib/nav/internal';
	import EditNotesCard from '$lib/form/EditNotesCard.svelte';
	import IconButton from '$lib/misc/IconButton.svelte';
	import NewHandoverProtocol from '$lib/components/documents/NewHandoverProtocol.svelte';
	import { fly } from 'svelte/transition';

	let { data }: PageProps = $props();
	let vehicle: Vehicle.Vehicle = $state(untrack(() => data.vehicle));
	let documents: Vehicle.VehicleDocument[] = $state(untrack(() => data.documents));
	const type = untrack(() => data.type!);
	let handoverModal: boolean = $state(false);

	const toDate = (iso: string): Date => {
		const [ y, m, d ] = iso.split('-').map(Number);
		return new Date(y, m - 1, d);
	};

	const calculateDaysBefore = (iso: string) => {
		const date = toDate(iso);
		const ms = date.valueOf() - Date.now();
		return Math.ceil(ms / 86400000);
	};

	const onFinished = (doc: Vehicle.VehicleDocument) => {
		if (documents.find((d) => d.id !== doc.id)) documents.push(doc);
		if (doc.type === 'vehicle_photo_exterior' && !vehicle.imageUrl?.length) {
			internal.postApi({ imageUrl: doc.url }, 'patch')
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
</script>

<svelte:head>
	<title>Dane pojazdu {vehicle.registrationNumber}</title>
</svelte:head>

<div class="row mt-n3">
	<div class="col-12 col-md-6">
		<div class="card mt-3">
			<h5 class="card-header">Dane pojazdu {vehicle.registrationNumber}</h5>
			<div class="card-body">
				{#if vehicle.imageUrl?.length}
					<img src={vehicle.imageUrl} alt={vehicle.name} class="mw-100" />
				{/if}
				<h6>{vehicle.name}</h6>
				<div class="datatable">
					<table class="table table-striped table-centered">
						<tbody>
							<tr>
								<td>Status</td>
								<td>
									<VehicleStatus status={vehicle.status} />
								</td>
							</tr>
							<tr>
								<td>Data pierwszej rejestracji</td>
								<td>{vehicle.firstRegistrationDate}</td>
							</tr>
							<tr>
								<td>Termin ważności ubezpieczenia</td>
								<td>{vehicle.insuranceExpiration} <span class="text-muted">(za {calculateDaysBefore(vehicle.insuranceExpiration)} dni)</span></td>
							</tr>
							<tr>
								<td>Termin ważności badania</td>
								<td>{vehicle.technicalExpiration} <span class="text-muted">(za {calculateDaysBefore(vehicle.technicalExpiration)} dni)</span></td>
							</tr>
						</tbody>
					</table>
				</div>
			</div>
			{#if vehicle.status === 'precheck'}
				<div class="card-footer flex-center">
					<PrecheckVerification {vehicle} {type} {documents} />
				</div>
			{/if}
		</div>
		<div class="card mt-3">
			<h5 class="card-header">Dodane dokumenty</h5>
			<div class="card-body">
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
			</div>
			<div class="card-footer d-flex justify-content-end">
				<UploadVehicleDatafiles {onFinished} {onProcessed} registrationNumber={vehicle.registrationNumber} />
			</div>
		</div>
	</div>
	<div class="col-12 col-md-6">
		<div class="card mt-3">
			<h5 class="card-header">Kierowca</h5>
			<div class="card-body">
				{#if vehicle.assignedDriverId}
					Przypisano do <a href="/drivers/{vehicle.assignedDriverId}">{vehicle.assignedDriverName}</a>
				{:else}
					<div class="flex-center flex-column">
						<div class="mb-3">Nie przypisano żadnego pojazdu</div>
						<IconButton icon="search" caption="Przypisz" onclick={() => (handoverModal = true)} size={6} />
					</div>
				{/if}
			</div>
		</div>
		<div class="card mt-3">
			<h5 class="card-header">Przejazdy</h5>
			<div class="card-body">
				<div class="datatable">
					<table class="table table-striped table-centered">
						<tbody>
							<tr>
								<td>Ilość przejazdów</td>
								<td>{vehicle.uberBoltTrips.totalTrips}</td>
							</tr>
							<tr>
								<td>Wartość przejazdów</td>
								<td>{formatCurrency(vehicle.uberBoltTrips.totalEarnings)}</td>
							</tr>
							<tr>
								<td>Średnia ocena</td>
								<td>{vehicle.uberBoltTrips.avgDriverRating}</td>
							</tr>
						</tbody>
					</table>
				</div>
			</div>
		</div>
		<div class="card mt-3">
			<h5 class="card-header">Typ pojazdu</h5>
			<div class="card-body">
				<div class="datatable">
					<table class="table table-striped table-centered">
						<tbody>
							<tr>
								<td>Model</td>
								<td>{type.name}</td>
							</tr>
							<tr>
								<td>Ilość pasażerów</td>
								<td>{type.maxPassengers}</td>
							</tr>
							<tr>
								<td>Rodzaj paliwa</td>
								<td>{fuelNames[type.fuelType]}</td>
							</tr>
						</tbody>
					</table>
				</div>
			</div>
		</div>
		<EditNotesCard bind:notes={vehicle.notes} />
	</div>
</div>

{#if handoverModal}
	<div class="position-fixed w-100 h-100 top-0 start-0 overflow-auto px-3 pb-3" style="z-index: 10" transition:fly>
		<NewHandoverProtocol {vehicle} />
	</div>
{/if}
