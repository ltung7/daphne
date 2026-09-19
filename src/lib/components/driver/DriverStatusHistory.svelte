<script lang="ts">
	import OffcanvasTimeline from '$lib/misc/OffcanvasTimeline.svelte';
	import { driverStatusMap } from './driverStatusMap';

	interface Props {
		driverId: string;
	}

	let { driverId }: Props = $props();
</script>

<OffcanvasTimeline
	header="Historia statusów"
	buttonCaption="Historia"
	fetchUrl={`/drivers/${driverId}/status`}
	getIcon={(event: Driver.DriverStatusChange) => driverStatusMap[event.status]?.icon || 'info-circle'}
	getColor={(event: Driver.DriverStatusChange) => driverStatusMap[event.status]?.color || 'primary'}
>
	{#snippet listItem(event: Driver.DriverStatusChange)}
		<span class="text-dark font-weight-bold fs-6">
			{driverStatusMap[event.status]?.caption || event.status}
		</span>
	{/snippet}
</OffcanvasTimeline>