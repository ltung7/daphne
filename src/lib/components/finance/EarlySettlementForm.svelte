<script lang="ts">
	import { m } from '$lib/paraglide/messages.js';
	import CustomFormNumeric from '$lib/form/CustomFormNumeric.svelte';
	import { internal } from '$lib/nav/internal';
	import { wrapLoader } from '$lib/nav/loader';
	import { page } from '$app/state';

	interface Props {
		driverId: string;
		driverName: string;
		balance: number;
		submitUrl?: string;
		onsuccess?: () => void;
	}

	let { driverId, driverName, balance, submitUrl, onsuccess }: Props = $props();

	let amount = $state(0);
	let error = $state<string | null>(null);

	const FEE_RATE = 0.05;
	const fee = $derived(round(amount * FEE_RATE));
	const actualPayout = $derived(round(amount - fee));

	function round(value: number): number {
		return Math.round(value * 100) / 100;
	}

	export async function submit() {
		if (amount <= 0) {
			error = 'Kwota musi być większa od zera';
			return;
		}

		error = null;

		// Use provided submitUrl or default to current URL + '/balance'
		let targetUrl = submitUrl;
		if (!targetUrl) {
			const baseUrl = page.url.pathname.replace(/\/$/, '');
			targetUrl = `${baseUrl}/balance`;
		}

		const response = await wrapLoader(
			internal.post(targetUrl, {
				driverId,
				driverName,
				requestedAmount: amount
			})
		);
		if (response.ok) {
			onsuccess?.();
		}
	}
</script>

<div class="d-flex flex-column mb-4">
	<span class="badge fs-6 px-3 py-2 bg-primary">{m.early_settlement_request()}</span>
	<span class="text-muted small">{m.early_settlement_payout_info()}</span>
</div>

<CustomFormNumeric caption={m.early_settlement_amount_label()} bind:value={amount} min={500} max={balance} fullwidth={true} size={5} />

<div class="mb-3 p-3 bg-light rounded">
	<div class="d-flex justify-content-between mb-1">
		<span class="small text-muted">{m.early_settlement_requested_amount()}</span>
		<span class="small fw-bold">{amount.toFixed(2)} PLN</span>
	</div>
	<div class="d-flex justify-content-between mb-1 text-danger">
		<span class="small">{m.early_settlement_fee()} (5%)</span>
		<span class="small fw-bold">-{fee.toFixed(2)} PLN</span>
	</div>
	<div class="d-flex justify-content-between fs-5 fw-bold">
		<span>{m.early_settlement_actual_payout()}</span>
		<span class="text-success">{actualPayout.toFixed(2)} PLN</span>
	</div>
</div>

{#if error}
	<div class="alert alert-danger small mb-0">{error}</div>
{/if}
