<script lang="ts">
	import { tweened } from 'svelte/motion';
	import { cubicOut } from 'svelte/easing';
	import IconButton from '$lib/misc/IconButton.svelte';
	import SectionCard from '$lib/misc/SectionCard.svelte';
	import AddLedgerEventModal from './AddLedgerEventModal.svelte';
	import DriverBalanceHistory from './DriverBalanceHistory.svelte';
	import { internal } from '$lib/nav/internal';
	import { balanceEventTypeConfig } from '$lib/assets/constants';

	interface Props {
		driverId: string;
		currentBalance: number;
		cashBalance: number;
		onBalanceUpdate?: (currentBalance: number, cashBalance: number) => void;
	}

	let { driverId, currentBalance, cashBalance, onBalanceUpdate }: Props = $props();

	let animatedCurrentBalance = tweened(0, { duration: 500, easing: cubicOut });
	let animatedCashBalance = tweened(0, { duration: 500, easing: cubicOut });

	$effect(() => {
		animatedCurrentBalance.set(currentBalance);
	});

	$effect(() => {
		animatedCashBalance.set(cashBalance);
	});

	let modalEventType = $state<DriverBalance.BalanceEventType | null>(null);
	let modalOpen = $state(false);

	const openModal = (type: DriverBalance.BalanceEventType) => {
		modalEventType = type;
		modalOpen = true;
	};

	const closeModal = () => {
		modalOpen = false;
		modalEventType = null;
	};

	const handleModalSubmit = async (data: any) => {
		try {
			const response = await internal.post(`/drivers/${driverId}/balance`, data);

			if (response.success) {
				const event: DriverBalance.BalanceEvent = response.eventData;
				currentBalance = event.runningBalance;
				onBalanceUpdate?.(currentBalance, cashBalance);
			}

			closeModal();
		} catch (err) {
			alert(err instanceof Error ? err.message : 'Failed to create event');
		}
	};

	const formatPLN = (amount: number): string => {
		return new Intl.NumberFormat('pl-PL', {
			style: 'currency',
			currency: 'PLN',
			minimumFractionDigits: 2,
			maximumFractionDigits: 2
		}).format(amount);
	};

	const getBalanceColor = (balance: number): string => {
		if (balance > 0) return 'text-success';
		if (balance < 0) return 'text-danger';
		return 'text-dark';
	};

	const mainEventTypes: DriverBalance.BalanceEventType[] = [
		'penalty',
		'repayments',
		'monthly_settlement',
		'early_settlement_discount',
		'cash_deposit',
		'cash_adjustment'
	] as const;

	const testEventTypes: DriverBalance.BalanceEventType[] = [
		'income_uber_weekly',
		'income_bolt_weekly',
		'cash_collection'
	] as const;
</script>

<SectionCard title="Saldo kierowcy">
	{#snippet cta()}
		<DriverBalanceHistory {driverId} />
	{/snippet}

	<div class="row g-3 mb-3">
		<div class="col-md-6">
			<div class="h-100 shadow-sm border border-dark border-radius-xl p-3 px-lg-4">
				<div class="d-flex justify-content-between align-items-start mb-2">
					<span class="text-muted small fw-medium">Saldo bieżące</span>
					<span class="badge bg-light text-dark small">Główne</span>
				</div>
				<div class="display-5 fw-bold {getBalanceColor(currentBalance)} mb-0">
					{formatPLN($animatedCurrentBalance)}
				</div>
				<div class="text-muted xsmall mt-1">Stan po ostatnim rozliczeniu</div>
			</div>
		</div>
		<div class="col-md-6">
			<div class="h-100 shadow-sm border border-dark border-radius-xl p-3 px-lg-4">
				<div class="d-flex justify-content-between align-items-start mb-2">
					<span class="text-muted small fw-medium">Saldo gotówkowe</span>
					<span class="badge bg-light text-dark small">Kasa</span>
				</div>
				<div class="display-5 fw-bold {getBalanceColor(cashBalance)} mb-0">
					{formatPLN($animatedCashBalance)}
				</div>
				<div class="text-muted xsmall mt-1">Gotówka do rozliczenia</div>
			</div>
		</div>
	</div>

	<div class="d-flex flex-wrap gap-2">
		{#each mainEventTypes as type}
			<IconButton
				{...balanceEventTypeConfig[type]}
				onclick={() => openModal(type)}
			/>
		{/each}
	</div>

	<div class="d-flex flex-wrap gap-2 mt-2">
		{#each testEventTypes as type}
			<IconButton
				{...balanceEventTypeConfig[type]}
				onclick={() => openModal(type)}
			/>
		{/each}
	</div>
</SectionCard>

{#if modalOpen && modalEventType}
	<AddLedgerEventModal {driverId} eventType={modalEventType} isOpen={modalOpen} close={closeModal} onSubmit={handleModalSubmit} />
{/if}
