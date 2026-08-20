<script lang="ts">
	import DatatableWrapper from '$lib/misc/DatatableWrapper.svelte';
	import { onMount } from 'svelte';
	import TooltipSquareIconLink from '$lib/misc/TooltipSquareIconLink.svelte';
	import { fetchDrivers } from '$lib/nav/fetchData';
	import { formatCurrency } from '$lib/utils/numberFormatter';

	let drivers: Driver.Driver[] = $state([]);
	let loaded = $state(false);

	const loadTypes = () => {
		fetchDrivers().then((list) => (drivers = list));
	};

	const headers: SvelteCustom.DatatableHeaders<keyof Driver.Driver> = [
		[ 'login', 'Login' ],
		[ 'status', 'Status' ],
		[ 'name', 'Imię i nazwisko' ],
		[ 'balance', 'Bilans' ],
        [ 'phone', 'Numer telefonu' ],
		[ 'notes', 'Notatki' ]
	];

	onMount(loadTypes);
</script>

<svelte:head>
	<title>Kierowcy</title>
</svelte:head>

<div class="card full-width-card">
	<h5 class="card-header flex-between">
		<div>Zarejestrowani kierowcy</div>
		<div class="my-n3">
			<TooltipSquareIconLink icon="add" hoverText="Dodaj nowego kierowcą" href="/drivers/new" size={2} />
		</div>
	</h5>
	<div class="card-body text-center">
		<DatatableWrapper {loaded} data={drivers} {headers}>
			{#snippet row(row)}
				<td class="py-1">
					<TooltipSquareIconLink icon="link" hoverText="Pokaż szczegóły" href="/drivers/{row.id}" size={5} />
				</td>
				<td>{row.login}</td>
				<td>{row.status}</td>
				<td>{row.name}</td>
				<td>{formatCurrency(row.balance)}</td>
                <td><a href="tel:{row.phone}">{row.phone}</a></td>
				<td>{row.notes}</td>
			{/snippet}
		</DatatableWrapper>
	</div>
</div>
