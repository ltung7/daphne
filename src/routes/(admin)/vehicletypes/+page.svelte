<script lang="ts">
	import DatatableWrapper from '$lib/misc/DatatableWrapper.svelte';
	import FeatCheck from '$lib/misc/FeatCheck.svelte';
	import { onMount } from 'svelte';
	import names from '$lib/assets/names.json';
	import TooltipSquareIconLink from '$lib/misc/TooltipSquareIconLink.svelte';
	import { fetchVehicleTypes } from '$lib/nav/fetchData';
	import IconLink from '$lib/misc/IconLink.svelte';
	import PageTitle from '$lib/misc/PageTitle.svelte';
	const fuelNames: Record<Vehicle.FuelType, string> = names.fuel as any;
	const transmissionNames: Record<Vehicle.TransmissionType, string> = {
		manual: 'Manualna',
		automatic: 'Automatyczna',
		cvt: 'CVT',
		'semi-automatic': 'Półautomatyczna',
		'dual-clutch': 'Dwusprzęgłowa'
	};

	let types: Vehicle.Type[] = $state([]);
	let loaded = $state(false);

	const loadTypes = () => {
		fetchVehicleTypes().then((list) => (types = list));
	};

	const headers: SvelteCustom.DatatableHeaders<keyof Vehicle.Type> = [
		[ 'name', 'Nazwa' ],
		[ 'fuelType', 'Rodzaj paliwa' ],
		[ 'transmission', 'Skrzynia biegów' ],
		[ 'seats', 'Liczba miejsc' ],
		[ 'premium', 'Premium' ],
		[ 'eco', 'Eco / Green' ],
		[ 'xl', 'XL / Van' ],
		[ 'notes', 'Notatki' ]
	];

	onMount(loadTypes);
</script>

<PageTitle title="Rodzaje pojazdów" subtitle="Lista zdefiniowanych typów pojazdów">
	<IconLink icon="add" caption="Nowy rodzaj" href="/vehicletypes/new" />
</PageTitle>

<div class="card">
	<div class="card-body text-center">
		<DatatableWrapper {loaded} data={types} {headers}>
			{#snippet row(row)}
				<td class="py-1">
					<div class="flex-center">
						<TooltipSquareIconLink href="/vehicles/new?type={row.id}" icon="add" hoverText="Dodaj pojazd tego typu" size={4} />
						<TooltipSquareIconLink icon="link" hoverText="Pokaż szczegóły" href="/vehicletypes/{row.id}" size={5} />
					</div>
				</td>
				<td>{row.name}</td>
				<td>{fuelNames[row.fuelType]}</td>
				<td>{transmissionNames[row.transmission]}</td>
				<td>{row.seats}</td>
				<td class="py-1"><FeatCheck checked={row.premium} /></td>
				<td class="py-1"><FeatCheck checked={row.eco} /></td>
				<td class="py-1"><FeatCheck checked={row.xl} /></td>
				<td>{row.notes}</td>
			{/snippet}
		</DatatableWrapper>
	</div>
</div>
