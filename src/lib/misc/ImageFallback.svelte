<script lang="ts">
	import type { HTMLImgAttributes } from 'svelte/elements';

	interface Props extends HTMLImgAttributes {
		src?: string;
		defaultSrc?: string;
		alt?: string;
		class?: string;
		link?: boolean;
	}

	let { src, defaultSrc = '/img/generic.jpg', alt = '', class: className = '', link = false, ...restProps }: Props = $props();

	// Initialize with default image if src is empty, null, or undefined
	let currentSrc = $derived(src || defaultSrc);

	function handleError() {
		// Prevent an infinite loop if defaultSrc is also unreachable
		if (currentSrc !== defaultSrc) {
			currentSrc = defaultSrc;
		}
	}
</script>

{#if link && currentSrc !== defaultSrc}
	<a href={currentSrc} target="_blank" rel="noopener noreferrer">
		<img src={currentSrc} {alt} class={className} onerror={handleError} {...restProps} />
	</a>
{:else}
	<img src={currentSrc} {alt} class={className} onerror={handleError} {...restProps} />
{/if}
