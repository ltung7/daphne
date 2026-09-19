<script lang="ts">
	import OffcanvasTimeline from '$lib/misc/OffcanvasTimeline.svelte';
	import { vehicleStatusMap } from './vehicleStatusMap';

	interface Props {
		vehicleId: string;
	}

	let { vehicleId }: Props = $props();
</script>

<OffcanvasTimeline
	header="Historia statusów"
	buttonCaption="Historia"
	fetchUrl={`/vehicles/${vehicleId}/status`}
	getIcon={(event: Vehicle.VehicleStatusChange) => vehicleStatusMap[event.status]?.icon || 'info-circle'}
	getColor={(event: Vehicle.VehicleStatusChange) => vehicleStatusMap[event.status]?.color || 'primary'}
>
	{#snippet listItem(event: Vehicle.VehicleStatusChange)}
		<span class="text-dark font-weight-bold fs-6">
			{vehicleStatusMap[event.status]?.caption || event.status}
		</span>
	{/snippet}
</OffcanvasTimeline>