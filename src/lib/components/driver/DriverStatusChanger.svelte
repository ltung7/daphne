<script lang="ts">
	import DriverVerification from '$lib/components/DriverVerification.svelte';
	import DriverStatusQuickActions from './DriverStatusQuickActions.svelte';
	import DriverLeaveRequest from './DriverLeaveRequest.svelte';
	import DriverSuspendRequest from './DriverSuspendRequest.svelte';
	import DriverBanRequest from './DriverBanRequest.svelte';

	interface Props {
		driver: Driver.Driver;
		documents?: Driver.DriverDocument[];
		onstatuschanged?: (status: Driver.Status) => void;
	}

	let { driver, documents = [], onstatuschanged }: Props = $props();
</script>

<div class="d-flex gap-3">
	{#if driver.status === 'pending_verification'}
		<DriverVerification
			{driver}
			{documents}
			onverified={(status) => {
				driver.status = status;
				onstatuschanged?.(status);
			}}
		/>
		<DriverStatusQuickActions actions={[ 'rejected' ]} {driver} {onstatuschanged} />
	{:else if driver.status === 'rejected'}
		<DriverStatusQuickActions actions={[ 'pending_verification' ]} {driver} {onstatuschanged} />
	{:else if driver.status === 'archived'}
		<DriverStatusQuickActions actions={[ 'pending_verification' ]} {driver} {onstatuschanged} />
	{:else if driver.status === 'suspended'}
		<DriverStatusQuickActions actions={[ 'available', 'archived' ]} {driver} {onstatuschanged} />
		<DriverBanRequest {driver} {onstatuschanged} />
	{:else if driver.status === 'banned'}
		<DriverStatusQuickActions actions={[ 'pending_verification' ]} {driver} {onstatuschanged} />
	{:else if driver.status === 'documents_expired'}
		<DriverSuspendRequest {driver} {onstatuschanged} />
		<DriverBanRequest {driver} {onstatuschanged} />
		<DriverStatusQuickActions actions={[ 'pending_verification', 'archived' ]} {driver} {onstatuschanged} />
	{:else if driver.status === 'available'}
		<DriverLeaveRequest {driver} {onstatuschanged} />
		<DriverSuspendRequest {driver} {onstatuschanged} />
		<DriverBanRequest {driver} {onstatuschanged} />
		<DriverStatusQuickActions actions={[ 'inactive', 'archived' ]} {driver} {onstatuschanged} />
	{:else if driver.status === 'active'}
		<DriverLeaveRequest {driver} {onstatuschanged} />
		<DriverSuspendRequest {driver} {onstatuschanged} />
		<DriverBanRequest {driver} {onstatuschanged} />
		<DriverStatusQuickActions actions={[ 'inactive' ]} {driver} {onstatuschanged} />
	{:else if driver.status === 'inactive'}
		<DriverSuspendRequest {driver} {onstatuschanged} />
		<DriverBanRequest {driver} {onstatuschanged} />
		<DriverStatusQuickActions actions={[ 'available', 'archived' ]} {driver} {onstatuschanged} />
	{:else if driver.status === 'on_leave'}
		<DriverSuspendRequest {driver} {onstatuschanged} />
		<DriverBanRequest {driver} {onstatuschanged} />
		<DriverStatusQuickActions actions={[ 'available', 'archived' ]} {driver} {onstatuschanged} />
	{/if}
</div>
