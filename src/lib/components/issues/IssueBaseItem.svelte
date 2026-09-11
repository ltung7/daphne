<script lang="ts" generics="T extends HealthCheck.BaseHealthIssue">
	import UIcon from "$lib/misc/UIcon.svelte";
	import type { Snippet } from "svelte";

	interface Props {
		problem: T;
		title: string;
		children: Snippet;
	}

	let { problem, title, children }: Props = $props();

	const link = $derived(
		problem.entityType === 'vehicle'
			? `/vehicles/${problem.entityId}`
			: problem.entityType === 'driver'
			? `/drivers/${problem.entityId}`
			: ''
	);
</script>

<a href={link} class="list-group-item list-group-item-action issue-item d-flex justify-content-between align-items-center">
	<div>
		<div class="d-flex align-items-center gap-2">
			{#if problem.severity === 'critical'}
				<span class="badge bg-danger rounded-pill small"> Krytyczne </span>
			{:else if problem.severity === 'warning'}
				<span class="badge bg-warning rounded-pill small"> Ostrzeżenie </span>
			{:else}
				<span class="badge bg-dark rounded-pill small"> Informacja </span>
			{/if}
			<h6 class="mb-0 fw-semibold">{title}</h6>
		</div>
		<div class="ms-badge small">{@render children()}</div>
	</div>
	<UIcon name="angle-circle-right" size={2} />
</a>

<style>
	.badge { width: 100px; }
	.ms-badge { margin-left: 108px; }
</style>