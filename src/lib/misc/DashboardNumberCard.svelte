<script lang="ts">
	import { Tween } from 'svelte/motion';
	import UIcon from '$lib/misc/UIcon.svelte';

	interface Props {
		value?: number;
		previousValue?: number;
		caption?: string;
		color?: string;
		prefix?: string;
		suffix?: string;
		icon?: string;
		decimals?: number;
		hoverText?: string;
	}

	let {
		value = 0,
		previousValue = undefined,
		caption = '',
		color = 'primary',
		prefix = '',
		suffix = '',
		icon = '',
		decimals = 0,
		hoverText = ''
	}: Props = $props();

	const animated = new Tween(0, { duration: 600 });

	$effect(() => {
		animated.set(value);
	});

	const displayValue = $derived(animated.current.toFixed(decimals));

	const percentChange = $derived(
		typeof previousValue === 'number' && previousValue !== 0
			? (((value - previousValue) / Math.abs(previousValue)) * 100).toFixed(1)
			: null
	);

	const isPositive = $derived(percentChange !== null && Number(percentChange) >= 0);
</script>

<div class="card">
	<div class="card-body p-3 position-relative">
		<div class="row">
			<div class="col-8">
				<div class="numbers">
					<p class="text-sm mb-0 text-uppercase fw-bold">{caption}</p>
					<h4 class="fw-bolder">
						{prefix}{displayValue}{suffix}
					</h4>
					{#if percentChange !== null}
						<p class="mb-0">
							<span class="text-sm fw-bolder {isPositive ? 'text-success' : 'text-danger'}">
								{isPositive ? '+' : ''}{percentChange}%
							</span>
						</p>
					{/if}
				</div>
			</div>
			<div class="col-4 d-flex align-items-center justify-content-end">
				<div class="icon icon-shape d-flex justify-content-center rounded-circle bg-gradient-{color} shadow-{color}">
					<UIcon name={icon} size={3} />
				</div>
			</div>
		</div>

		{#if hoverText}
			<div class="hover-overlay position-absolute top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center p-3">
				<p class="mb-0 text-sm text-center fs-6">{hoverText}</p>
			</div>
		{/if}
	</div>
</div>

<style>
	.hover-overlay {
		background-color: rgba(0, 0, 0, 0.75);
		color: #fff;
		opacity: 0;
		transition: opacity 0.2s ease;
		pointer-events: none;
		border-radius: var(--bs-card-border-radius);
		cursor: pointer;
	}

	.card-body:hover .hover-overlay {
		opacity: 1;
		pointer-events: auto;
	}
</style>