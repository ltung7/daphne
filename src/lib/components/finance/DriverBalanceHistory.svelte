<script lang="ts">
	import { balanceEventTypeConfig } from '$lib/assets/constants.js';
	import OffcanvasTimeline from '$lib/misc/OffcanvasTimeline.svelte';
	import plTimezone, { optionalTimestamp } from '$lib/utils/tz';

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

<OffcanvasTimeline header="Historia salda" buttonCaption="Historia" fetchUrl={`/drivers/${driverId}/balance`} getIcon={(event: DriverBalance.BalanceEvent) => balanceEventTypeConfig[event.type]?.icon || 'info-circle'} getColor={(event: DriverBalance.BalanceEvent) => balanceEventTypeConfig[event.type]?.color || 'primary'}>
	{#snippet listItem(event: DriverBalance.BalanceEvent)}
		<span class="text-dark font-weight-bold fs-6">
			{balanceEventTypeConfig[event.type]?.caption || 'Zdarzenie'}
		</span>
		<span class="small text-muted">
			{#if event.amount > 0}
				Wpływ: <span class="text-success fw-bold">+{formatPLN(event.amount)}</span>
			{:else if event.amount < 0}
				Obciążenie: <span class="text-danger fw-bold">{formatPLN(event.amount)}</span>
			{/if}
		</span>
		<div class="d-flex justify-content-between text-muted xsmall">
			<span>Saldo po zdarzeniu: <strong>{formatPLN(event.runningBalance)}</strong></span>
		</div>
	{/snippet}
	{#snippet moreDetails(event: DriverBalance.BalanceEvent)}
		{@const config = balanceEventTypeConfig[event.type]}
		<table class="table table-striped table-centered">
			<tbody>
				<tr>
					<td colspan="2" class="text-center py-2">
						<div class="badge text-center" style="background-color: {config.color}">
							{config.caption}
						</div>
					</td>
				</tr>
				<tr>
					{#if event.amount > 0}
						<td>Wpływ</td>
						<td class="text-success fw-bold">+{formatPLN(event.amount)}</td>
					{:else if event.amount < 0}
						<td>Obciążenie</td>
						<td class="text-danger fw-bold">{formatPLN(event.amount)}</td>
					{/if}
				</tr>
				<tr>
					<td class="text-dark">Saldo po zdarzeniu</td>
					<td>{formatPLN(event.runningBalance)}</td>
				</tr>
				<tr>
					<td class="text-dark">Data utworzenia</td>
					<td>{plTimezone(event.timestamp)}</td>
				</tr>
				<tr>
					<td class="text-dark">Data potwierdzenia</td>
					<td>{optionalTimestamp(event.confirmedAt)}</td>
				</tr>
				<tr>
					<td class="text-dark">Osoba potwierdzająca</td>
					<td>{event.confirmedName || '-'}</td>
				</tr>
				{#if event.metadata.referenceId}
					<tr>
						<td class="text-dark">Referencja</td>
						<td>{event.metadata.referenceId}</td>
					</tr>
				{/if}
				{#if event.metadata.note}
					<tr>
						<td class="text-dark">Notatka</td>
						<td>{event.metadata.note}</td>
					</tr>
				{/if}
			</tbody>
		</table>
	{/snippet}
</OffcanvasTimeline>
