<script lang="ts" generics="T extends { timestamp: string | number | Date }">
	import { Offcanvas } from '@sveltestrap/sveltestrap';
	import UIcon from '$lib/misc/UIcon.svelte';
	import { formatDateTimePL } from '$lib/utils/dateFormat';
	import IconButton from '$lib/misc/IconButton.svelte';
	import { internal } from '$lib/nav/internal';
	import type { Snippet } from 'svelte';
	import ClosableModal from './ClosableModal.svelte';

	interface Props {
		header: string;
		buttonCaption: string;
		limit?: number;
		fetchUrl: string;
		list?: string; // The property name in the response containing the array (e.g. 'events')

		// Data resolvers
		getIcon?: (item: T) => string;
		getColor?: (item: T) => string;

		// Snippets
		listItem: Snippet<[T]>;
		moreDetails?: Snippet<[T]>;
	}

	let { header, buttonCaption, limit = 10, fetchUrl, list = 'events', getIcon, getColor, listItem, moreDetails }: Props = $props();

	let items = $state<Array<T>>([]);
	let loading = $state(false);
	let loadingMore = $state(false);
	let error = $state<string | null>(null);
	let hasMore = $state(true);
	let offset = $state(0);
	let isOpen = $state(false);
	let modalIsOpen = $state(false);
	let detail: T | undefined = $state()

	const open = async () => {
		isOpen = true;
		await loadItems(0, false);
	};

	const loadItems = async (newOffset: number = 0, append = false) => {
		if (append) {
			loadingMore = true;
		} else {
			loading = true;
		}
		error = null;

		try {
			const response = await internal.get(fetchUrl, { limit, offset: newOffset });
			if (!response) {
				throw new Error('Failed to fetch data');
			}

			const newItems = response[list] || [];

			if (append) {
				items = [ ...items, ...newItems ];
			} else {
				items = newItems;
			}

			offset = newOffset + newItems.length;
			hasMore = newItems.length >= limit;
		} catch (err) {
			error = err instanceof Error ? err.message : 'Unknown error';
			hasMore = false;
		} finally {
			loading = false;
			loadingMore = false;
		}
	};

	const toggle = () => {
		isOpen = !isOpen;
	}

	const toggleModal = (event: T) => {
		detail = event;
		modalIsOpen = !modalIsOpen;
	}

	const loadMore = () => {
		loadItems(offset, true);
	};
</script>

<IconButton size={6} icon="pending" caption={buttonCaption} onclick={open} />

<Offcanvas {toggle} bind:isOpen placement="end" {header}>
	{#if loading}
		<div class="text-center py-3">
			<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
			<span class="ms-2">Ładowanie historii...</span>
		</div>
	{:else if error}
		<div class="alert alert-danger">{error}</div>
	{:else if items.length > 0}
		<div class="timeline timeline-one-side">
			{#each items as item}
				<div class="timeline-block my-3">
					<span class="timeline-step badge" style="background-color: {getColor ? getColor(item) : 'var(--bs-primary)'}">
						<UIcon name={getIcon ? getIcon(item) : 'info-circle'} />
					</span>
					<div class="timeline-content mw-100">
						<div class="d-flex justify-content-between flex-column flex-sm-row">
							<button class="d-flex flex-column btn-clear" disabled={!moreDetails} onclick={() => toggleModal(item)}>
								{@render listItem(item)}
							</button>
							<div class="text-end">
								<small class="text-muted d-flex align-items-center justify-content-end">
									<UIcon size={8} name="clock" />
									<span class="ms-2 small">{formatDateTimePL(item.timestamp)}</span>
								</small>
							</div>
						</div>
					</div>
				</div>
			{/each}
		</div>
		{#if hasMore}
			<div class="text-center py-2">
				<IconButton icon="chevron-down" caption="Załaduj więcej" size={5} outline disabled={loadingMore} onclick={loadMore} />
				{#if loadingMore}
					<span class="ms-2">
						<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
						Ładowanie...
					</span>
				{/if}
			</div>
		{/if}
	{:else}
		<div class="text-muted py-3 text-center">Brak historii do wyświetlenia.</div>
	{/if}
</Offcanvas>

{#if moreDetails && detail}
	<ClosableModal bind:isOpen={modalIsOpen} headerText="Szczegóły zdarzenia" centered>
		{@render moreDetails(detail)}
	</ClosableModal>
{/if}