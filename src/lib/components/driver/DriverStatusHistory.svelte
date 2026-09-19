<script lang="ts">
	import OffcanvasTimeline from '$lib/misc/OffcanvasTimeline.svelte';
	import plTimezone from '$lib/utils/tz';
	import DriverStatus from './DriverStatus.svelte';
	import { driverStatusMap } from './driverStatusMap';

	interface Props {
		driverId: string;
	}

	let { driverId }: Props = $props();
</script>

<OffcanvasTimeline header="Historia statusów" buttonCaption="Historia" fetchUrl={`/drivers/${driverId}/status`} getIcon={(event: Driver.DriverStatusChange) => driverStatusMap[event.status]?.icon || 'info-circle'} getColor={(event: Driver.DriverStatusChange) => driverStatusMap[event.status]?.color || 'primary'}>
	{#snippet listItem(event: Driver.DriverStatusChange)}
		<span class="text-dark font-weight-bold fs-6">
			{driverStatusMap[event.status]?.caption || event.status}
		</span>
	{/snippet}
	{#snippet moreDetails(event: Driver.DriverStatusChange)}
		<table class="table table-striped table-centered">
			<tbody>
				<tr>
					<td class="text-dark">Status</td>
					<td><DriverStatus status={event.status} /></td>
				</tr>
				<tr>
					<td class="text-dark">Operator</td>
					<td>{event.userName}</td>
				</tr>
				<tr>
					<td class="text-dark">Data zdarzenia</td>
					<td>{plTimezone(event.timestamp)}</td>
				</tr>
				{#if event.extraData.note}
					<tr>
						<td class="text-dark">Notatka</td>
						<td>{event.extraData.note}</td>
					</tr>
				{/if}
				{#if event.extraData.dateFrom}
					<tr>
						<td class="text-dark">Data rozpoczęcia</td>
						<td>{event.extraData.dateFrom}</td>
					</tr>
				{/if}
				{#if event.extraData.dateEnd}
					<tr>
						<td class="text-dark">Data zakończenia</td>
						<td>{event.extraData.dateEnd}</td>
					</tr>
				{/if}
			</tbody>
		</table>
	{/snippet}
</OffcanvasTimeline>
