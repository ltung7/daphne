<script lang="ts">
	import TooltipText from './TooltipText.svelte';
	import type { Snippet } from 'svelte';

	interface Props {
		width?: string;
		children?: Snippet;
	}

	let { width = '20vw', children }: Props = $props();
	let expanded = $state(false);

	const handleClick = () => (expanded = !expanded);
	const handleKeydown = (e: KeyboardEvent) => {
		if (e.key === 'Enter' || e.key === ' ') {
			e.preventDefault();
			handleClick();
		}
	};

	const tooltipText = $derived(expanded ? 'Kliknij, aby zwinąć' : 'Kliknij, aby rozwinąć');
</script>

<TooltipText hoverText={tooltipText} tooltipClass="max-w-none">
	<span role="button" tabindex={0} class:truncate={!expanded} style="max-width: {width};" onclick={handleClick} onkeydown={handleKeydown}>
		{#if children}
			{@render children()}
		{/if}
	</span>
</TooltipText>

<style>
	.truncate {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
</style>
