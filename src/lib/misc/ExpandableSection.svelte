<script lang="ts">
	import type { Snippet } from 'svelte';
	import UIcon from './UIcon.svelte';
	import { Collapse } from '@sveltestrap/sveltestrap';

	interface Props {
		caption?: string;
		trigger?: Snippet;
		children: Snippet;
		expanded?: boolean;
		icon?: string;
	}

	let { caption, trigger, children, expanded = $bindable(false), icon = 'angle-small-down' }: Props = $props();

	const toggle = () => {
		expanded = !expanded;
	};
</script>

<div class="card mb-3 border-radius-md">
	<button class="btn transition fs-6 fw-bold btn-clear mb-0 w-100 d-flex align-items-center justify-content-between" class:active={expanded} onclick={toggle} aria-expanded={expanded} type="button">
		<div class="d-flex align-items-center gap-2 flex-1 min-w-0">
			{#if trigger}
				{@render trigger()}
			{:else if caption}
				<span class="fw-medium text-truncate">{caption}</span>
			{/if}
		</div>
		<UIcon name={expanded ? 'angle-small-up' : icon} color="dark" size={4} class="flex-shrink-0 transition-transform duration-200 my-n2" />
	</button>

	<Collapse isOpen={expanded} class="border-top">
		<div class="card-body pt-3">
			{@render children()}
		</div>
	</Collapse>
</div>

<style>
	.btn {
		position: relative;
		background-color: var(--bs-white);
		color: var(--bs-primary);
		z-index: 1;
		overflow: hidden;
		transition: 0.3s ease;
	}

	/* Create the gradient layer, hidden by default */
	.btn::before {
		content: '';
		position: absolute;
		inset: 0;
		background-image: linear-gradient(310deg, var(--bs-primary-bg-subtle), var(--bs-primary));
		opacity: 0;
		z-index: -1;
		transition: opacity 0.3s ease;
	}

	/* Fade in the gradient and change text color */
	.btn.active {
		color: var(--bs-white);
		border-bottom-left-radius: 0;
		border-bottom-right-radius: 0;
	}

	.btn.active::before {
		opacity: 1;
	}
</style>
