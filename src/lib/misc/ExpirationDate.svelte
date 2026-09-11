<script lang="ts">
	import UIcon from "./UIcon.svelte";

	const toDate = (iso: string): Date => {
		const [ y, m, d ] = iso.split('-').map(Number);
		return new Date(y, m - 1, d);
	};

	const calculateDaysBefore = (iso: string) => {
		const date = toDate(iso);
		const ms = date.valueOf() - Date.now();
		return Math.ceil(ms / 86400000);
	};

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