<script lang="ts">
	import DatatableWrapper from '$lib/misc/DatatableWrapper.svelte';
	import { onMount } from 'svelte';
	import TooltipSquareIconLink from '$lib/misc/TooltipSquareIconLink.svelte';
	import { fetchVehicles } from '$lib/nav/fetchData';
	import VehicleStatus from '$lib/misc/VehicleStatus.svelte';
	import PageTitle from '$lib/misc/PageTitle.svelte';
	import IconLink from '$lib/misc/IconLink.svelte';
	import CustomFormColorPicker from '$lib/form/CustomFormColorPicker.svelte';

	let vehicles: Vehicle.Vehicle[] = $state([]);
	let loaded = $state(false);

	const loadTypes = () => {
		fetchVehicles().then((list) => (vehicles = list));
	};

	const headers: SvelteCustom.DatatableHeaders<keyof Vehicle.Vehicle> = [
		[ 'registrationNumber', 'Numer rejestracyjny' ],
		[ 'name', 'Nazwa' ],
		[ 'color', 'Kolor' ],
		[ 'status', 'Status' ],
		[ 'assignedDriverName', 'Kierowca' ],
		[ 'fuelCardId', 'Karta paliwowa' ],
		[ 'firstRegistrationDate', 'Data pierwszej rejestracji' ],
		[ 'notes', 'Notatki' ]
	];

	onMount(loadTypes);
</script>

<PageTitle title="Pojazdy" subtitle="Lista zarejestrowanych pojazdów">
	<IconLink icon="add" caption="Nowy pojazd" href="/vehicles/new" />
</PageTitle>

<div class="card">
	<div class="card-body text-center">
		<DatatableWrapper {loaded} data={vehicles} {headers}>
			{#snippet row(row)}
				<td class="py-1">
					<TooltipSquareIconLink icon="link" hoverText="Pokaż szczegóły" href="/vehicles/{row.id}" size={5} />
				</td>
				<td class="fw-bold">{row.registrationNumber}</td>
				<td>{row.name}</td>
				<td class="py-1">
					<CustomFormColorPicker value={row.color} disabled class="mb-0" />
				</td>
				<td class="py-1">
					<VehicleStatus status={row.status} />
				</td>
				<td>{row.assignedDriverName}</td>
				<td>{row.fuelCardId}</td>
				<td>{row.firstRegistrationDate}</td>
				<td>{row.notes}</td>
			{/snippet}
		</DatatableWrapper>
	</div>
</div>
