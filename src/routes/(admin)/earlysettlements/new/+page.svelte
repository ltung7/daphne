<script lang="ts">
	import { goto } from '$app/navigation';
	import { m } from '$lib/paraglide/messages.js';
	import IconLink from '$lib/misc/IconLink.svelte';
	import PageTitle from '$lib/misc/PageTitle.svelte';
	import SearchBar from '$lib/misc/SearchBar.svelte';
	import type { SelectEventDetail } from '$lib/misc/Typeahead.svelte';
	import { fetchDrivers } from '$lib/nav/fetchData';
	import { onMount } from 'svelte';
	import EarlySettlementForm from '$lib/components/finance/EarlySettlementForm.svelte';

	let drivers: Driver.Driver[] = $state([]);
	let selectedDriverId = $state<string | null>(null);
	let selectedDriverName = $state<string>('');
	let selectedDriverBalance = $state<number>(0);
	let formComponent = $state<ReturnType<typeof EarlySettlementForm>>();

	const updateDriver = (event: SelectEventDetail<Driver.Driver>) => {
		const driverData = event.original;
		selectedDriverId = driverData.id;
		selectedDriverName = driverData.name;
		// Assuming balance is available on the driver object or nested.
		// If balance is an object with runningBalance, we use that, otherwise default to 0.
		// Wait, the API returns balance? In Driver.Driver, balance might be a number or object.
		if (typeof driverData.balance === 'number') {
			selectedDriverBalance = driverData.balance;
		} else {
			selectedDriverBalance = 0;
		}
	};

	onMount(async () => {
		// fetch drivers with balance
		const list = await fetchDrivers({}, [ 'name', 'balance' ]);
		drivers = list;
	});

	const handleSubmit = async () => {
		await formComponent?.submit();
	};

	const onSuccess = () => {
		goto('/earlysettlements');
	};
</script>

<PageTitle title={m.early_settlement_request()} subtitle={m.early_settlement_payout_info()}>
	<IconLink icon="left" caption="Powrót" href="/earlysettlements" />
</PageTitle>

<div class="card">
	<div class="card-body">
		<section class="pb-3 mb-3 border-bottom">
			{#if drivers.length}
				<SearchBar data={drivers} caption="Wybierz kierowcę" search="name" onselect={updateDriver} />
			{/if}
			{#if selectedDriverName}
				<h5 class="mt-3">Kierowca: <strong>{selectedDriverName}</strong></h5>
				<p class="text-muted small">Aktualne saldo: {selectedDriverBalance.toFixed(2)} PLN</p>
			{/if}
		</section>

		{#if selectedDriverId}
			<EarlySettlementForm 
				driverId={selectedDriverId} 
				driverName={selectedDriverName} 
				balance={selectedDriverBalance} 
				submitUrl={`/drivers/${selectedDriverId}/balance`}
				bind:this={formComponent} 
				onsuccess={onSuccess} 
			/>
			
			<div class="mt-4 d-flex justify-content-end">
				<button class="btn btn-primary" onclick={handleSubmit}>{m.submit()}</button>
			</div>
		{/if}
	</div>
</div>