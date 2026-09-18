<script lang="ts">
	import { onMount } from 'svelte';
	import IconButton from '$lib/misc/IconButton.svelte';
	import SectionCard from '$lib/misc/SectionCard.svelte';
	import { Offcanvas } from '@sveltestrap/sveltestrap';
	import UIcon from '$lib/misc/UIcon.svelte';
	import { formatDateTimePL } from '$lib/utils/dateFormat';

	interface Props {
		driverId: string;
		currentBalance: number;
		cashBalance: number;
	}

	let { driverId, currentBalance, cashBalance }: Props = $props();

	const LIMIT = 20;
	let events = $state<Array<BalanceEvent>>([]);
	let loading = $state(false);
	let loadingMore = $state(false);
	let error = $state<string | null>(null);
	let hasMore = $state(true);
	let offset = $state(0);
	let offcanvasOpen = $state(false);

	// Action handlers (placeholders for now)
	const onAddPenalty = () => {
		alert('Dodaj karę - do zaimplementowania');
	};

	const onAddDeduction = () => {
		alert('Dodaj potrącenie - do zaimplementowania');
	};

	const onPayout = () => {
		alert('Wypłata - do zaimplementowania');
	};

	const onEarlySettlement = () => {
		alert('Wcześniejsze rozliczenie - do zaimplementowania');
	};

	const onCashAdjustment = () => {
		alert('Korekta gotówki - do zaimplementowania');
	};

	interface BalanceEvent {
		id: string;
		driverId: string;
		type: string;
		status: string;
		amount: number;
		runningBalance: number;
		referenceId?: string;
		referenceType?: string;
		metadata: Record<string, any>;
		timestamp: number;
		createdBy: string;
		confirmedAt?: number;
		confirmedBy?: string;
		reversedByEventId?: string;
		reversalReason?: string;
	}

	const eventTypeLabels: Record<string, string> = {
		income_uber_weekly: 'Przychód Uber (tygodniowy)',
		income_bolt_weekly: 'Przychód Bolt (tygodniowy)',
		penalty: 'Kara',
		monthly_settlement: 'Rozliczenie miesięczne',
		repayments: 'Spłaty',
		early_settlement_discount: 'Zniżka za wcześniejsze rozliczenie',
		cash_collection: 'Zebranie gotówki',
		cash_deposit: 'Wpłata gotówki',
		cash_adjustment: 'Korekta gotówki'
	};

	const eventTypeIcons: Record<string, string> = {
		income_uber_weekly: 'uber',
		income_bolt_weekly: 'bolt',
		penalty: 'minus-circle',
		monthly_settlement: 'cash-coin',
		repayments: 'arrow-return-left',
		early_settlement_discount: 'percent',
		cash_collection: 'hand-holding-usd',
		cash_deposit: 'money-bills',
		cash_adjustment: 'edit'
	};

	const eventTypeColors: Record<string, string> = {
		income_uber_weekly: '#00a859',
		income_bolt_weekly: '#222222',
		penalty: '#dc3545',
		monthly_settlement: '#198754',
		repayments: '#fd7e14',
		early_settlement_discount: '#6f42c1',
		cash_collection: '#0dcaf0',
		cash_deposit: '#198754',
		cash_adjustment: '#6c757d'
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

	const loadEvents = async (newOffset: number = 0, append = false) => {
		if (!driverId) return;

		if (append) {
			loadingMore = true;
		} else {
			loading = true;
		}
		error = null;

		try {
			const response = await fetch(`/drivers/${driverId}/balance?limit=${LIMIT}&offset=${newOffset}`);
			if (!response.ok) {
				throw new Error(`Failed to fetch balance history: ${response.status}`);
			}
			const data = await response.json();

			if (append) {
				events = [ ...events, ...data ];
			} else {
				events = data;
			}

			offset = newOffset + data.length;
			hasMore = data.length >= LIMIT;
		} catch (err) {
			error = err instanceof Error ? err.message : 'Unknown error';
			hasMore = false;
		} finally {
			loading = false;
			loadingMore = false;
		}
	};

	const openHistory = async () => {
		offcanvasOpen = true;
		await loadEvents(0, false);
	};

	const loadMore = () => {
		loadEvents(offset, true);
	};

	onMount(() => {
		// Pre-load events when component mounts if needed
	});
</script>

<SectionCard title="Saldo kierowcy">
	{#snippet cta()}
		<IconButton icon="pending" caption="Historia" size={6} onclick={openHistory} />
	{/snippet}

	<div class="row g-3 mb-3">
		<div class="col-md-6">
			<div class="h-100 shadow-sm border border-dark border-radius-xl p-3 px-lg-4">
				<div class="d-flex justify-content-between align-items-start mb-2">
					<span class="text-muted small fw-medium">Saldo bieżące</span>
					<span class="badge bg-light text-dark small">Główne</span>
				</div>
				<div class="display-5 fw-bold {getBalanceColor(currentBalance)} mb-0">
					{formatPLN(currentBalance)}
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
					{formatPLN(cashBalance)}
				</div>
				<div class="text-muted xsmall mt-1">Gotówka do rozliczenia</div>
			</div>
		</div>
	</div>

	<div class="d-flex flex-wrap gap-2">
		<IconButton icon="user-police" caption="Mandat" color="danger" outline size={6} onclick={onAddPenalty} />
		<IconButton icon="money-bill-lock" caption="Potrącenie" color="warning" outline size={6} onclick={onAddDeduction} />
		<IconButton icon="money-bills" caption="Wypłata" color="success" outline size={6} onclick={onPayout} />
		<IconButton icon="fee" caption="Wcześniejsze rozliczenie" color="info" outline size={6} onclick={onEarlySettlement} />
		<IconButton icon="edit" caption="Korekta gotówki" color="secondary" outline size={6} onclick={onCashAdjustment} />
	</div>
</SectionCard>

<Offcanvas toggle={() => (offcanvasOpen = !offcanvasOpen)} bind:isOpen={offcanvasOpen} placement="end">
	<div class="offcanvas-header">
		<h5 class="offcanvas-title">Historia salda</h5>
		<button type="button" class="btn-close" onclick={() => (offcanvasOpen = false)} aria-label="Close"></button>
	</div>
	<div class="offcanvas-body">
		{#if loading}
			<div class="text-center py-3">
				<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
				<span class="ms-2">Ładowanie historii...</span>
			</div>
		{:else if error}
			<div class="alert alert-danger">{error}</div>
		{:else if events.length > 0}
			<div class="timeline timeline-one-side">
				{#each events as event}
					<div class="timeline-block my-3">
						<span class="timeline-step badge" style="background-color: {eventTypeColors[event.type] || '#ccc'};">
							<UIcon name={eventTypeIcons[event.type] || 'circle'} />
						</span>
						<div class="timeline-content mw-100" style="margin-left: 30px; width: calc(100% - 30px);">
							<div class="d-flex justify-content-between flex-column flex-sm-row pt-1">
								<div class="d-flex align-items-center gap-2">
									<span class="text-dark text-sm font-weight-bold fs-5">
										{eventTypeLabels[event.type] || event.type}
									</span>
									<span class="badge fw-medium" style="background-color: {eventTypeColors[event.type] || '#ccc'};">
										{formatPLN(event.amount)}
									</span>
								</div>
								<div class="text-end">
									<small class="text-muted d-flex align-items-center justify-content-end">
										<UIcon size={8} name="clock" />
										<span class="ms-2">{formatDateTimePL(event.timestamp)}</span>
									</small>
								</div>
							</div>
							<div class="d-flex justify-content-between text-muted xsmall mt-1">
								<span>Saldo po zdarzeniu: <strong>{formatPLN(event.runningBalance)}</strong></span>
								{#if event.referenceId}
									<span>Ref: {event.referenceId}</span>
								{/if}
							</div>
						</div>
					</div>
				{/each}
			</div>
			{#if hasMore}
				<div class="text-center py-2">
					<IconButton icon="chevron-down" caption="Załaduj więcej" size={5} outline disabled={loadingMore} onclick={loadMore} />
					{#if loadingMore}
						<span class="ms-2">
							<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
							Ładowanie...
						</span>
					{/if}
				</div>
			{/if}
		{:else}
			<div class="text-muted py-3 text-center">Brak historii zdarzeń salda.</div>
		{/if}
	</div>
</Offcanvas>
