<script lang="ts">
	import { calculateDaysBefore } from "$lib/utils/dates";
	import UIcon from "./UIcon.svelte";

	interface Props { date: string; warning?: number }

	let { date, warning = 7 }: Props = $props();

	const days = $derived(calculateDaysBefore(date));
</script>

{#if days < 0}
	{date} <span class="small text-danger fw-bold d-inline-flex">
		(<UIcon name="triangle-warning" size={0} class="me-1" /> wygasł {-days} dni temu)
	</span>
{:else if days < warning}
	{date} <span class="small text-warning">(za {days} dni)</span>
{:else}
	{date} <span class="small text-muted">(za {days} dni)</span>
{/if}