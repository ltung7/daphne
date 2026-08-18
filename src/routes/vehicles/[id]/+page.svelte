<script lang="ts">
	import { untrack } from 'svelte';
	import type { PageProps } from './$types';
	import { fuelNames } from '$lib/assets/constants';
	import { formatCurrency } from '$lib/utils/numberFormatter';
	import VehicleStatus from '$lib/misc/VehicleStatus.svelte';
	import UploadVehicleDatafiles from '$lib/form/UploadVehicleDatafiles.svelte';

	let { data }: PageProps = $props();
	let vehicle: Vehicle.Vehicle = $state(untrack(() => data.vehicle));
	let documents: Vehicle.VehicleDocument[] = $state([]);
	const type = untrack(() => data.type!);

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
		documents.push(doc);
	};
</script>

<div class="row">
	<div class="col-12 col-md-6">
		<div class="card">
			<h5 class="card-header">Dane pojazdu {vehicle.registrationNumber}</h5>
			<div class="card-body">
				{#if vehicle.imageUrl?.length}
					<img src={vehicle.imageUrl} alt={vehicle.name} />
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
		</div>
		<div class="card mt-3">
			<h5 class="card-header">Dodane dokumenty</h5>
			<div class="card-body">
				{#if documents?.length}
					{#each documents as doc}
						<div class="border rounded p-2">
							{doc.name} {doc.registrationNumber}
						</div>
					{/each}
				{:else}
					Brak dodanych dokumentów
				{/if}
			</div>
			<div class="card-footer d-flex justify-content-end">
				<UploadVehicleDatafiles {onFinished} />
			</div>
		</div>
	</div>
	<div class="col-12 col-md-6">
		<div class="card">
			<h5 class="card-header">Kierowca</h5>
			<div class="card-body">
				{#if vehicle.assignedDriver}
					Przypisano {vehicle.assignedDriver}
				{:else}
					Nie przypisano żadnego kierowcy
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
	</div>
</div>
