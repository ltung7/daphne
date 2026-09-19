<script lang="ts">
	import ClosableModal from '$lib/misc/ClosableModal.svelte';
	import CustomFormNumeric from '$lib/form/CustomFormNumeric.svelte';
	import CustomFormTextarea from '$lib/form/CustomFormTextarea.svelte';
	import { balanceEventTypeConfig } from '$lib/assets/constants.js';
	import CustomFormText from '$lib/form/CustomFormText.svelte';

	interface Props {
		driverId: string;
		eventType: DriverBalance.BalanceEventType;
		isOpen: boolean;
		close: () => void;
		onSubmit: (data: LedgerEventData) => void;
	}

	let { driverId, eventType, isOpen, close, onSubmit }: Props = $props();

	const config = $derived(balanceEventTypeConfig[eventType]);

	let amount = $state(0);
	let note = $state('');
	let referenceId = $state('');

	interface LedgerEventData {
		driverId: string;
		type: DriverBalance.BalanceEventType;
		amount: number;
		metadata: {
			referenceId?: string;
			note?: string;
		};
	}

	const handleSubmit = () => {
		const roundedAmount = Math.round(amount * 100) / 100;
		const finalAmount = config.isIncome ? roundedAmount : -roundedAmount;

		const data: LedgerEventData = {
			driverId,
			type: eventType,
			amount: finalAmount,
			metadata: {}
		};

		if (note.trim()) {
			data.metadata.note = note.trim();
		}

		if (config.requiresReferenceId) {
			data.metadata.referenceId = referenceId.trim()
		}

		onSubmit(data);
	};
</script>

<ClosableModal {isOpen} toggle={close} headerText={config.caption} size="md" buttonCaption="Dodaj" onClick={handleSubmit}>
	<div class="flex-between mb-4">
		<span class="badge fs-6 px-3 py-2" style="background-color: {config.color};">
			{config.caption}
		</span>
		<span class="text-muted small">
			{config.isIncome ? 'Przychód (+)' : config.allowNegative ? 'Wydatek / korekta (±)' : 'Wydatek (-)'}
		</span>
	</div>

	<CustomFormNumeric caption="Kwota (PLN)" bind:value={amount} decimal={true} min={config.allowNegative ? -999999 : 0} max={999999} fullwidth={true} size={5} />

	{#if config.requiresReferenceId}
		<CustomFormText size={6} bind:value={referenceId} caption="Referencja" />
		<div class="xsmall text-muted mt-n2 lh-1">Referencja może oznaczać numer dokumentu, numer mandatu lub kategoria wykroczenia</div>
	{/if}

	<CustomFormTextarea caption="Notatka (opcjonalnie)" bind:value={note} size={3} />

	{#if config.isCashEvent}
		<div class="alert alert-info small mb-0">Zdarzenie gotówkowe wpłynie na saldo gotówkowe kierowcy.</div>
	{/if}
</ClosableModal>
