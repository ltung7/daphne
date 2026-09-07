<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		title: string;
		children: Snippet;
		cta?: Snippet;
	}

	let { title, children, cta }: Props = $props();
</script>

<section class="section-card">
	<div class="d-flex justify-content-between align-items-end mb-2 flex-wrap gap-3 border-bottom pb-2">
		<div>
			<h4 class="fw-bold mb-0 text-dark">{title}</h4>
		</div>
		{#if cta}
			<div>
				{@render cta?.()}
			</div>
		{/if}
	</div>

	<div class="card card-body">
		{@render children()}
	</div>
</section>
