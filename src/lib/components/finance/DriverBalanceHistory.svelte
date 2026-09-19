<script lang="ts">
	import { balanceEventTypeConfig } from '$lib/assets/constants.js';
	import OffcanvasTimeline from '$lib/misc/OffcanvasTimeline.svelte';

	interface Props {
		driverId: string;
	}

	let { driverId }: Props = $props();

	const formatPLN = (amount: number): string => {
		return new Intl.NumberFormat('pl-PL', {
			style: 'currency',
			currency: 'PLN',
			minimumFractionDigits: 2,
			maximumFractionDigits: 2
		}).format(amount);
	};
</script>

<OffcanvasTimeline
	header="Historia salda"
	buttonCaption="Historia"
	fetchUrl={`/drivers/${driverId}/balance`}
	getIcon={(event: DriverBalance.BalanceEvent) => balanceEventTypeConfig[event.type]?.icon || 'info-circle'}
	getColor={(event: DriverBalance.BalanceEvent) => balanceEventTypeConfig[event.type]?.color || 'primary'}
>
	{#snippet listItem(event: DriverBalance.BalanceEvent)}
		<span class="text-dark font-weight-bold fs-6">
			{balanceEventTypeConfig[event.type]?.caption || 'Zdarzenie'}
		</span>
		<span class="small">
		{#if event.amount > 0}
			Wpływ: <span class="text-success fw-bold">+{formatPLN(event.amount)}</span>
		{:else if event.amount < 0}
			Obciążenie: <span class="text-danger fw-bold">{formatPLN(event.amount)}</span>
		{/if}
		</span>
		<div class="d-flex justify-content-between text-muted xsmall">
			<span>Saldo po zdarzeniu: <strong>{formatPLN(event.runningBalance)}</strong></span>
			{#if event.referenceId}
				<span>Ref: {event.referenceId}</span>
			{/if}
		</div>
	{/snippet}
</OffcanvasTimeline>