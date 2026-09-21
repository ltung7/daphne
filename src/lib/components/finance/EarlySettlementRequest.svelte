<script lang="ts">
	import { m } from '$lib/paraglide/messages.js';
	import ClosableModal from '$lib/misc/ClosableModal.svelte';
	import IconButton from '$lib/misc/IconButton.svelte';
	import CustomFormNumeric from '$lib/form/CustomFormNumeric.svelte';
	import { internal } from '$lib/nav/internal';
	import { wrapLoader } from '$lib/nav/loader';

	interface Props {
		driverId: string;
		balance: number;
	}

	let { driverId, balance }: Props = $props();

	let isOpen = $state(false);
	let amount = $state(0);
	let error = $state<string | null>(null);

	const FEE_RATE = 0.05;
	const fee = $derived(round(amount * FEE_RATE));
	const actualPayout = $derived(round(amount - fee));

	function round(value: number): number {
		return Math.round(value * 100) / 100;
	}

	const openModal = () => {
		amount = 0;
		error = null;
		isOpen = true;
	};

	const closeModal = () => {
		isOpen = false;
	};

	async function handleSubmit() {
		if (amount <= 0) {
			error = 'Kwota musi być większa od zera';
			return;
		}

		error = null;

		const response = await wrapLoader(
			internal.post('/driver/balance', {
				driverId,
				requestedAmount: amount
			})
		);
		if (response.ok) closeModal();

		closeModal();
	}
</script>

<IconButton icon="fee" caption={m.early_settlement_request()} size={6} onclick={openModal} />

<ClosableModal {isOpen} toggle={closeModal} headerText={m.early_settlement_request()} size="md" buttonCaption={m.submit()} onClick={handleSubmit}>
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
</ClosableModal>
