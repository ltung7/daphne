<script lang="ts">
	import type { Snippet } from 'svelte';
	import { onMount } from 'svelte';
	import IconLink from './IconLink.svelte';
	import UIcon from './UIcon.svelte';
	import Spinner from './Spinner.svelte';
	import { internal } from '$lib/nav/internal';

	interface Props {
		title: string;
		back?: string;
		subtitle?: string;
		children?: Snippet;
		onDataLoaded?: (response: any) => void;
	}

	let { title, subtitle, back, children, onDataLoaded }: Props = $props();

	let loading = $state(false);

	const loadData = (force: boolean = false) => {
		loading = true;
		internal
			.getApi({}, force)
			.then((response) => {
				onDataLoaded?.(response);
			})
			.finally(() => {
				loading = false;
			});
	};

	onMount(() => {
		if (onDataLoaded) {
			loadData(false);
		}
	});
</script>

<svelte:head>
	<title>{title}</title>
</svelte:head>

<div class="d-flex justify-content-between align-items-end mb-3 flex-wrap gap-3 border-bottom pb-2">
	<div>
		<h1 class="display-6 fw-bold mb-1 text-dark">{title}</h1>
		{#if subtitle}
			<p class="text-muted mb-0 fs-6 fw-light fst-italic">{subtitle}</p>
		{/if}
	</div>
	{#if onDataLoaded || children || back?.length}
		<div class="d-flex align-items-center gap-3">
			{#if onDataLoaded}
				<button
					class="d-flex align-items-center btn btn-outline-primary mb-0"
					disabled={loading}
					onclick={() => loadData(true)}
				>
					{#if loading}
						<Spinner size="1rem" color="primary" />
					{:else}
						<UIcon name="refresh" size={5} color="primary" gradient />
					{/if}
					<span class="fs-7 ms-2">Odśwież</span>
				</button>
			{/if}
			{#if children}
				{@render children?.()}
			{:else if back?.length}
				<IconLink icon="left" color="dark" caption="Powrót do listy" href={back} />
			{/if}
		</div>
	{/if}
</div>
