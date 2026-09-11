<script lang="ts">
	import { untrack, type Snippet } from 'svelte';
	import IssueBaseItem from './IssueBaseItem.svelte';
	import { calculateDaysBefore } from '$lib/utils/dates';

	interface Props {
		problem: HealthCheck.HealthIssue;
        title: string;
        children: Snippet;
	}

	const { problem: rawProblem, children, title }: Props = $props();
	const problem = untrack(() => rawProblem as HealthCheck.ExpirationHealthIssue);
	const days = calculateDaysBefore(problem.expirationDate);
    if (days < 0 && problem.severity !== 'critical') problem.severity = 'critical';
</script>

<IssueBaseItem {problem} {title}>
	{#if days < 0}
		Termin {@render children()} minął <b class="text-dark">{-days}</b> dni temu
	{:else}
		{@render children()} mija za <b class="text-dark">{days}</b> dni
	{/if}
</IssueBaseItem>
