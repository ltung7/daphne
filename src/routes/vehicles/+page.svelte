<script lang="ts">
	import DatatableWrapper from '$lib/misc/DatatableWrapper.svelte';
	import { onMount } from 'svelte';
	import TooltipSquareIconLink from '$lib/misc/TooltipSquareIconLink.svelte';
	import { fetchVehicles } from '$lib/nav/fetchData';
	import VehicleStatus from '$lib/misc/VehicleStatus.svelte';

	let vehicles: Vehicle.Vehicle[] = $state([]);
	let loaded = $state(false);

	const loadTypes = () => {
		fetchVehicles().then((list) => (vehicles = list));
	};

	const headers: SvelteCustom.DatatableHeaders<keyof Vehicle.Vehicle> = [
		[ 'registrationNumber', 'Numer rejestracyjny' ],
		[ 'name', 'Nazwa' ],
		[ 'status', 'Status' ],
		[ 'assignedDriver', 'Kierowca' ],
		[ 'fuelCardId', 'Karta paliwowa' ],
		[ 'firstRegistrationDate', 'Data pierwszej rejestracji' ],
		[ 'notes', 'Notatki' ]
	];

	onMount(loadTypes);
</script>

<svelte:head>
	<title>Pojazdy</title>
</svelte:head>

<div class="card full-width-card">
	<h5 class="card-header flex-between">
		<div>Zarejestrowane pojazdy</div>
		<div class="my-n3">
			<TooltipSquareIconLink icon="add" hoverText="Dodaj nowy pojazd" href="/vehicles/new" size={2} />
		</div>
	</h5>
	<div class="card-body text-center basket-height">
		<DatatableWrapper {loaded} data={vehicles} {headers}>
			{#snippet row(row)}
				<td class="py-1">
					<TooltipSquareIconLink icon="link" hoverText="Pokaż szczegóły" href="/vehicles/{row.id}" size={5} />
				</td>
				<td class="fw-bold">{row.registrationNumber}</td>
				<td>{row.name}</td>
				<td class="py-1">
					<VehicleStatus status={row.status} />
				</td>
				<td>{row.assignedDriver}</td>
				<td>{row.fuelCardId}</td>
				<td>{row.firstRegistrationDate}</td>
				<td>{row.notes}</td>
			{/snippet}
		</DatatableWrapper>
	</div>
</div>
