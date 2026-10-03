<script lang="ts">
	import VehicleVerification from '$lib/components/vehicle/VehicleVerification.svelte';
	import VehicleStatusQuickActions from './VehicleStatusQuickActions.svelte';
	import VehicleStatusRequests from './VehicleStatusRequests.svelte';
	import VehicleMaintenanceRequest from './VehicleMaintenanceRequest.svelte';
	import VehicleRetireRequest from './VehicleRetireRequest.svelte';

	interface Props {
		vehicle: Vehicle.Vehicle;
		type: Vehicle.Type | null;
		documents?: Vehicle.VehicleDocument[];
		onstatuschanged?: (status: Vehicle.Status) => void;
	}

	let { vehicle, type, documents = [], onstatuschanged }: Props = $props();
</script>

<div class="d-flex gap-3">
	{#if vehicle.status === 'precheck'}
		{#if type}
			<VehicleVerification
				{vehicle}
				{type}
				{documents}
				onverified={(status) => {
					vehicle.status = status;
					onstatuschanged?.(status);
				}}
			/>
		{/if}
	{:else if vehicle.status === 'available'}
		<VehicleMaintenanceRequest {vehicle} {onstatuschanged} />
		<VehicleStatusRequests actions={[ 'broken', 'unmovable' ]} {vehicle} {onstatuschanged} />
		<VehicleRetireRequest {vehicle} {onstatuschanged} />
	{:else if vehicle.status === 'assigned'}
		<VehicleMaintenanceRequest {vehicle} {onstatuschanged} />
		<VehicleStatusRequests actions={[ 'broken', 'unmovable' ]} {vehicle} {onstatuschanged} />
	{:else if vehicle.status === 'under_maintenance'}
		<VehicleStatusQuickActions actions={[ 'available' ]} {vehicle} {onstatuschanged} />
		<VehicleStatusRequests actions={[ 'broken', 'unmovable' ]} {vehicle} {onstatuschanged} />
		<VehicleRetireRequest {vehicle} {onstatuschanged} />
	{:else if vehicle.status === 'broken'}
		<VehicleMaintenanceRequest {vehicle} {onstatuschanged} />
		<VehicleStatusQuickActions actions={[ 'available' ]} {vehicle} {onstatuschanged} />
		<VehicleStatusRequests actions={[ 'unmovable' ]} {vehicle} {onstatuschanged} />
		<VehicleRetireRequest {vehicle} {onstatuschanged} />
	{:else if vehicle.status === 'unmovable'}
		<VehicleMaintenanceRequest {vehicle} {onstatuschanged} />
		<VehicleStatusQuickActions actions={[ 'available' ]} {vehicle} {onstatuschanged} />
		<VehicleStatusRequests actions={[ 'broken' ]} {vehicle} {onstatuschanged} />
		<VehicleRetireRequest {vehicle} {onstatuschanged} />
	{:else if vehicle.status === 'retired'}
		<VehicleStatusQuickActions actions={[ 'precheck' ]} {vehicle} {onstatuschanged} />
	{/if}
</div>
