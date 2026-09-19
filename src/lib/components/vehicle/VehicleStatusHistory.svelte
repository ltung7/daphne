<script lang="ts">
	import OffcanvasTimeline from '$lib/misc/OffcanvasTimeline.svelte';
	import plTimezone from '$lib/utils/tz';
	import VehicleStatus from './VehicleStatus.svelte';
	import { vehicleStatusMap } from './vehicleStatusMap';

	interface Props {
		vehicleId: string;
	}

	let { vehicleId }: Props = $props();
</script>

<OffcanvasTimeline header="Historia statusów" buttonCaption="Historia" fetchUrl={`/vehicles/${vehicleId}/status`} getIcon={(event: Vehicle.VehicleStatusChange) => vehicleStatusMap[event.status]?.icon || 'info-circle'} getColor={(event: Vehicle.VehicleStatusChange) => vehicleStatusMap[event.status]?.color || 'primary'}>
	{#snippet listItem(event: Vehicle.VehicleStatusChange)}
		<span class="text-dark font-weight-bold fs-6">
			{vehicleStatusMap[event.status]?.caption || event.status}
		</span>
	{/snippet}
	{#snippet moreDetails(event: Vehicle.VehicleStatusChange)}
		<table class="table table-striped table-centered">
			<tbody>
				<tr>
					<td class="text-dark">Status</td>
					<td><VehicleStatus status={event.status} /></td>
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
				{#if event.extraData.expectedEndDate}
					<tr>
						<td class="text-dark">Spodziewana data zakończenia</td>
						<td>{event.extraData.expectedEndDate}</td>
					</tr>
				{/if}
			</tbody>
		</table>
	{/snippet}
</OffcanvasTimeline>
