<script lang="ts">
	import { onMount } from 'svelte';
	import DriverStatusHistoryItem from './DriverStatusHistoryItem.svelte';
	import SectionCard from '$lib/misc/SectionCard.svelte';
	import IconButton from '$lib/misc/IconButton.svelte';

	let { driverId }: { driverId: string } = $props();

	const LIMIT = 10;
	let statuses = $state<Array<Driver.DriverStatusChange>>([]);
	let loading = $state(false);
	let loadingMore = $state(false);
	let error = $state<string | null>(null);
	let hasMore = $state(true);
	let offset = $state(0);

	const loadStatuses = async (newOffset: number = 0, append = false) => {
		if (!driverId) return;

		if (append) {
			loadingMore = true;
		} else {
			loading = true;
		}
		error = null;

		try {
			const response = await fetch(`/drivers/${driverId}/status?limit=${LIMIT}&offset=${newOffset}`);
			if (!response.ok) {
				throw new Error(`Failed to fetch status history: ${response.status}`);
			}
			const data = await response.json();
			
			if (append) {
				statuses = [ ...statuses, ...data ];
			} else {
				statuses = data;
			}
			
			offset = newOffset + data.length;
			hasMore = data.length >= LIMIT;
		} catch (err) {
			error = err instanceof Error ? err.message : 'Unknown error';
			hasMore = false;
		} finally {
			loading = false;
			loadingMore = false;
		}
	};

	onMount(async () => {
		await loadStatuses(0, false);
	});
</script>

<SectionCard title="Historia statusów">
	{#snippet cta()}
		{#if hasMore}
			<IconButton 
				icon="chevron-down" 
				caption="Załaduj więcej" 
				size={5} 
				outline 
				disabled={loadingMore}
				onclick={() => loadStatuses(offset, true)}
			/>
		{/if}
	{/snippet}
	<div class="driver-status-history">
		{#if loading}
			<div class="text-center py-3">
				<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
				<span class="ms-2">Ładowanie historii...</span>
			</div>
		{:else if error}
			<div class="alert alert-danger">{error}</div>
		{:else if statuses.length > 0}
			<div class="timeline timeline-one-side">
				{#each statuses as item}
					<DriverStatusHistoryItem {item} />
				{/each}
			</div>
			{#if loadingMore}
				<div class="text-center py-2">
					<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
					<span class="ms-2">Ładowanie...</span>
				</div>
			{/if}
		{:else}
			<div class="text-muted py-3 text-center">Brak historii zmian statusu.</div>
		{/if}
	</div>
</SectionCard>