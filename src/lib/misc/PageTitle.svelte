<script lang="ts">
	import type { Snippet } from 'svelte';
	import IconLink from './IconLink.svelte';

	interface Props {
		title: string;
		back?: string;
		subtitle?: string;
		children?: Snippet;
	}

	let { title, subtitle, back, children }: Props = $props();
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
	{#if children}
		<div>
			{@render children?.()}
		</div>
	{:else if back?.length}
		<IconLink icon="left" color="dark" caption="Powrót do listy" href={back} />
	{/if}
</div>
