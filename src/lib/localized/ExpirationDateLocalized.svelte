<script lang="ts">
	import { calculateDaysBefore } from "$lib/utils/dates";
	import UIcon from "../misc/UIcon.svelte";
	import { m } from '$lib/paraglide/messages.js';

	interface Props { date: string; warning?: number }

	let { date, warning = 7 }: Props = $props();

	const days = $derived(calculateDaysBefore(date));
</script>

{#if days < 0}
	{date} <span class="small text-danger fw-bold d-inline-flex">
		(<UIcon name="triangle-warning" size={0} class="me-1" /> {m.expiration_expired_days_ago({ days: -days })})
	</span>
{:else if days < warning}
	{date} <span class="small text-warning">({m.expiration_in_days({ days })})</span>
{:else}
	{date} <span class="small text-muted">({m.expiration_in_days({ days })})</span>
{/if}