<script lang="ts">
	import TooltipText from './TooltipText.svelte';
	import type { Snippet } from 'svelte';

	interface Props {
		text?: string;
		width?: string;
		children?: Snippet;
	}

	let { text = '', width = '20vw', children }: Props = $props();
	let expanded = $state(false);

	const handleClick = () => expanded = !expanded;
	const handleKeydown = (e: KeyboardEvent) => {
		if (e.key === 'Enter' || e.key === ' ') {
			e.preventDefault();
			handleClick();
		}
	};
</script>

<TooltipText
	{text}
	hoverText={text}
	tooltipClass="max-w-none"
>
	<span
		role="button"
		tabindex={0}
		class:truncate={!expanded}
		class:cursor-pointer={!!text || !!children}
		style="max-width: {width};"
		onclick={handleClick}
		onkeydown={handleKeydown}
	>
		{#if children}
			{@render children()}
		{:else}
			{text}
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