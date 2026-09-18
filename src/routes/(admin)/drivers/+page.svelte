<script lang="ts">
	import DatatableWrapper from '$lib/misc/DatatableWrapper.svelte';
	import { onMount } from 'svelte';
	import TooltipSquareIconLink from '$lib/misc/TooltipSquareIconLink.svelte';
	import { fetchDrivers } from '$lib/nav/fetchData';
	import { formatCurrency } from '$lib/utils/numberFormatter';
	import DriverStatus from '$lib/components/driver/DriverStatus.svelte';
	import PageTitle from '$lib/misc/PageTitle.svelte';
	import IconLink from '$lib/misc/IconLink.svelte';

	let drivers: Driver.Driver[] = $state([]);
	let loaded = $state(false);

	const loadDrivers = () => {
		fetchDrivers().then((list) => (drivers = list));
	};

	const headers: SvelteCustom.DatatableHeaders<keyof Driver.Driver> = [
		[ 'name', 'Imię i nazwisko' ],
		[ 'status', 'Status' ],
		[ 'assignedVehicle', 'Przypisany pojazd' ],
		[ 'balance', 'Bilans' ],
        [ 'phone', 'Numer telefonu' ],
		[ 'notes', 'Notatki' ]
	];

	onMount(loadDrivers);
</script>

<PageTitle title="Kierowcy" subtitle="Lista zarejestrowanych kierowcow">
	<IconLink icon="add" caption="Nowy kierowca" href="/drivers/new" />
</PageTitle>

<div class="card">
	<div class="card-body text-center">
		<DatatableWrapper {loaded} data={drivers} {headers}>
			{#snippet row(row)}
				<td class="py-1">
					<TooltipSquareIconLink icon="link" hoverText="Pokaż szczegóły" href="/drivers/{row.id}" size={5} />
				</td>
				<td>{row.name}</td>
				<td class="py-1"><DriverStatus status={row.status} /></td>
				<td>{row.assignedVehicle ? row.assignedVehicle.registrationNumber : "-"}</td>
				<td>{formatCurrency(row.balance)}</td>
                <td><a href="tel:{row.phone}">{row.phone}</a></td>
				<td>{row.notes}</td>
			{/snippet}
		</DatatableWrapper>
	</div>
</div>
