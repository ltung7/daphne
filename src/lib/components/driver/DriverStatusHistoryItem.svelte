<script lang="ts">
	import UIcon from '$lib/misc/UIcon.svelte';
	import { driverStatusMap } from './driverStatusMap';
	import { formatDateTimePL, formatDatePL } from '$lib/utils/dateFormat';
	import { Offcanvas } from '@sveltestrap/sveltestrap';

	interface Props {
		item: Driver.DriverStatusChange;
	}

	let { item }: Props = $props();

	let config = $derived(driverStatusMap[item.status as Driver.Status]);
	
	let formattedDate = $derived(formatDateTimePL(item.timestamp));
	let formattedFullDate = $derived(formatDatePL(item.timestamp));
	
	let offcanvasOpen = $state(false);
	
	const toggleOffcanvas = () => {
		offcanvasOpen = !offcanvasOpen;
	};
	
	const openDetails = () => {
		offcanvasOpen = true;
	};
</script>

<div class="timeline-block my-3">
	<span class="timeline-step badge" style="background-color: {config?.color || '#ccc'};">
		<UIcon name={config?.icon || 'question'} />
	</span>
	<button 
		class="btn btn-clear timeline-content mw-100" 
		onclick={openDetails}
		type="button"
	>
		<div class="d-flex justify-content-between flex-column flex-sm-row pt-1">
			<div class="text-dark text-sm font-weight-bold fs-5">{config?.caption || item.status}</div>
			<div class="text-right">
				<small class="text-muted d-flex align-items-center justify-content-end">
					<UIcon size={8} name="clock" />
					<span class="ms-2">{formattedDate}</span>
				</small>
			</div>
		</div>
	</button>
</div>

<Offcanvas toggle={toggleOffcanvas} bind:isOpen={offcanvasOpen} placement="end">
	<div class="offcanvas-header">
		<h5 class="offcanvas-title">{config?.caption || item.status}</h5>
		<button type="button" class="btn-close" onclick={() => (offcanvasOpen = false)} aria-label="Close"></button>
	</div>
	<div class="offcanvas-body">
		<div class="mb-3">
			<div class="form-label fw-bold text-muted small">Status</div>
			<div class="d-flex align-items-center gap-2">
				<span class="badge fs-6" style="background-color: {config?.color || '#ccc'};">
					<UIcon name={config?.icon || 'question'} class="me-1" />
					{config?.caption || item.status}
				</span>
			</div>
		</div>
		
		<div class="mb-3">
			<div class="form-label fw-bold text-muted small">Data i godzina</div>
			<div class="d-flex align-items-center gap-2">
				<UIcon name="calendar" size={16} class="text-muted" />
				<span>{formattedFullDate} o {formattedDate.split(' ').pop()}</span>
			</div>
		</div>
		
		{#if item.timestamp}
		<div class="mb-3">
			<div class="form-label fw-bold text-muted small">Znacznik czasu</div>
			<div class="font-monospace text-sm">{item.timestamp}</div>
		</div>
		{/if}
		
		{#if item.userName}
		<div class="mb-3">
			<div class="form-label fw-bold text-muted small">Zmienił użytkownik</div>
			<div class="d-flex align-items-center gap-2">
				<UIcon name="user" size={16} class="text-muted" />
				<span>{item.userName}</span>
			</div>
			{#if item.userId}
			<div class="font-monospace text-xs text-muted mt-1">ID: {item.userId}</div>
			{/if}
		</div>
		{/if}
		
		{#if item.extraData?.notes}
		<div class="mb-3">
			<div class="form-label fw-bold text-muted small">Notatki</div>
			<div class="p-3 bg-light rounded">{item.extraData.notes}</div>
		</div>
		{/if}
		
		{#if item.extraData && Object.keys(item.extraData).length > (item.extraData.notes ? 1 : 0)}
		<div class="mb-3">
			<div class="form-label fw-bold text-muted small">Dodatkowe dane</div>
			<pre class="p-3 bg-light rounded text-sm">{JSON.stringify(item.extraData, null, 2)}</pre>
		</div>
		{/if}
	</div>
</Offcanvas>

<style>
	button.btn.timeline-content {
		margin-left: 30px;
		width: calc(100% - 30px) !important;
	}
</style>