<script lang="ts">
	import type { PageData } from './$types';
	import PageTitle from '$lib/misc/PageTitle.svelte';
	import IconButton from '$lib/misc/IconButton.svelte';
	import ClosableModal from '$lib/misc/ClosableModal.svelte';
	import CustomFormTextarea from '$lib/form/CustomFormTextarea.svelte';
	import { internal } from '$lib/nav/internal';
	import { goto } from '$app/navigation';
	import { untrack } from 'svelte';

	interface Props {
		data: PageData;
	}

	let { data }: Props = $props();

	let earlySettlement = $derived(data.earlySettlement);
	
	let isRequested = $state(untrack(() => data.earlySettlement.status === 'requested'));

	// Modals
	let showApproveModal = $state(false);
	let showRejectModal = $state(false);
	let rejectionReason = $state('');
	let error = $state<string | null>(null);

	function formatDate(timestamp: number) {
		return new Date(timestamp).toLocaleString('pl-PL');
	}

	function getStatusLabel(status: string) {
		switch (status) {
			case 'requested':
				return 'Oczekujący';
			case 'approved':
				return 'Zatwierdzony';
			case 'rejected':
				return 'Odrzucony';
			case 'cancelled':
				return 'Anulowany';
			default:
				return status;
		}
	}

	function getStatusBadgeClass(status: string) {
		switch (status) {
			case 'requested':
				return 'bg-info';
			case 'approved':
				return 'bg-success';
			case 'rejected':
				return 'bg-danger';
			case 'cancelled':
				return 'bg-secondary';
			default:
				return 'bg-dark';
		}
	}

	async function handleApprove() {
		error = null;

		const response = await internal.post(`/earlysettlements/${earlySettlement.id}/api/approve`);

		if (response.success) {
			showApproveModal = false;
			isRequested = false;
			window.location.reload();
		}
	}

	async function handleReject() {
		if (!rejectionReason.trim()) {
			error = 'Musisz podać powód odrzucenia';
			return;
		}
		error = null;

		const response = await internal.post(`/earlysettlements/${earlySettlement.id}/api/reject`, { reason: rejectionReason });

		if (response.success) {
			showRejectModal = false;
			isRequested = false;
			window.location.reload();
		}
	}
</script>

<PageTitle title="Wniosek o wcześniejsze rozliczenie" subtitle={earlySettlement.id}>
	<IconButton icon="arrow-left" caption="Wróć do listy" color="secondary" outline onclick={() => goto('/earlysettlements')} />
</PageTitle>

<div class="row">
	<div class={isRequested ? "col-md-8" : "col-md-12"}>
		<div class="card mb-4">
			<div class="card-header pb-0 p-3">
				<h6 class="mb-0">Szczegóły wniosku</h6>
			</div>
			<div class="card-body p-3">
				<ul class="list-group">
					<li class="list-group-item border-0 d-flex justify-content-between ps-0 mb-2 border-radius-lg">
						<div class="d-flex flex-column">
							<h6 class="mb-1 text-dark font-weight-bold text-sm">Status</h6>
						</div>
						<div class="d-flex align-items-center text-sm">
							<span class="badge {getStatusBadgeClass(earlySettlement.status)}">
								{getStatusLabel(earlySettlement.status)}
							</span>
						</div>
					</li>
					<li class="list-group-item border-0 d-flex justify-content-between ps-0 mb-2 border-radius-lg">
						<div class="d-flex flex-column">
							<h6 class="mb-1 text-dark font-weight-bold text-sm">Kierowca</h6>
							<span class="text-xs">{earlySettlement.driverId}</span>
						</div>
						<div class="d-flex align-items-center text-sm">
							<a href="/drivers/{earlySettlement.driverId}" class="fw-bold">{earlySettlement.driverName}</a>
						</div>
					</li>
					<li class="list-group-item border-0 d-flex justify-content-between ps-0 mb-2 border-radius-lg">
						<div class="d-flex flex-column">
							<h6 class="mb-1 text-dark font-weight-bold text-sm">Data zgłoszenia</h6>
						</div>
						<div class="d-flex align-items-center text-sm">
							{formatDate(earlySettlement.createdAt)}
						</div>
					</li>
					<li class="list-group-item border-0 d-flex justify-content-between ps-0 mb-2 border-radius-lg">
						<div class="d-flex flex-column">
							<h6 class="mb-1 text-dark font-weight-bold text-sm">Wnioskowana kwota</h6>
						</div>
						<div class="d-flex align-items-center text-sm">
							{earlySettlement.requestedAmount.toFixed(2)} PLN
						</div>
					</li>
					<li class="list-group-item border-0 d-flex justify-content-between ps-0 mb-2 border-radius-lg">
						<div class="d-flex flex-column">
							<h6 class="mb-1 text-dark font-weight-bold text-sm">Prowizja (5%)</h6>
						</div>
						<div class="d-flex align-items-center text-sm text-danger">
							-{earlySettlement.fee.toFixed(2)} PLN
						</div>
					</li>
					<li class="list-group-item border-0 d-flex justify-content-between ps-0 border-radius-lg bg-gray-100">
						<div class="d-flex flex-column">
							<h6 class="mb-1 text-dark font-weight-bold text-sm">Rzeczywista wypłata</h6>
						</div>
						<div class="d-flex align-items-center text-sm text-success fw-bold fs-5">
							{earlySettlement.actualPayout.toFixed(2)} PLN
						</div>
					</li>

					{#if earlySettlement.status === 'rejected'}
						<li class="list-group-item border-0 d-flex justify-content-between ps-0 mb-2 border-radius-lg">
							<div class="d-flex flex-column">
								<h6 class="mb-1 text-dark font-weight-bold text-sm">Odrzucono</h6>
								<span class="text-xs text-muted">Przez: {earlySettlement.rejectedByName}</span>
								{#if earlySettlement.rejectionReason}
									<span class="text-xs text-muted mt-1">Powód: {earlySettlement.rejectionReason}</span>
								{/if}
							</div>
							<div class="d-flex align-items-center text-sm">
								{formatDate(earlySettlement.rejectedAt || 0)}
							</div>
						</li>
					{/if}

					{#if earlySettlement.status === 'approved'}
						<li class="list-group-item border-0 d-flex justify-content-between ps-0 mb-2 border-radius-lg">
							<div class="d-flex flex-column">
								<h6 class="mb-1 text-dark font-weight-bold text-sm">Zatwierdzono</h6>
								<span class="text-xs text-muted">Przez: {earlySettlement.approvedByName}</span>
							</div>
							<div class="d-flex align-items-center text-sm">
								{formatDate(earlySettlement.approvedAt || 0)}
							</div>
						</li>
					{/if}
				</ul>
			</div>
		</div>
	</div>

	{#if isRequested}
		<div class="col-md-4">
			<div class="card mb-4">
				<div class="card-header pb-0 p-3">
					<h6 class="mb-0">Aktualne saldo kierowcy</h6>
				</div>
				<div class="card-body p-3 text-center">
					<h2 class={data.currentBalance < 0 ? 'text-danger' : 'text-success'}>
						{data.currentBalance.toFixed(2)} PLN
					</h2>
					{#if data.currentBalance < earlySettlement.requestedAmount}
						<div class="alert alert-danger text-white text-sm mt-3">Kierowca nie ma wystarczających środków na koncie, aby zrealizować ten wniosek.</div>
					{:else}
						<div class="alert alert-success text-white text-sm mt-3">Kierowca posiada wystarczające środki.</div>
					{/if}
				</div>
			</div>

			<div class="card">
				<div class="card-header pb-0 p-3">
					<h6 class="mb-0">Akcje</h6>
				</div>
				<div class="card-body p-3 d-flex flex-column gap-2">
					<IconButton icon="check" caption="Zatwierdź wniosek" color="success" disabled={data.currentBalance < earlySettlement.requestedAmount} onclick={() => (showApproveModal = true)} />
					<IconButton icon="cross" caption="Odrzuć wniosek" color="danger" onclick={() => (showRejectModal = true)} />
				</div>
			</div>
		</div>
	{/if}
</div>

<ClosableModal bind:isOpen={showApproveModal} headerText="Zatwierdź wniosek" buttonCaption="Zatwierdź" onClick={handleApprove}>
	<p>Czy na pewno chcesz zatwierdzić ten wniosek?</p>
	<p>Ta operacja utworzy <strong>dwa zdarzenia</strong> w systemie finansowym kierowcy:</p>
	<ul>
		<li>Wypłata: <strong class="text-danger">-{earlySettlement.actualPayout.toFixed(2)} PLN</strong></li>
		<li>Prowizja (5%): <strong class="text-danger">-{earlySettlement.fee.toFixed(2)} PLN</strong></li>
	</ul>

	{#if error}
		<div class="alert alert-danger text-white text-sm mt-3">{error}</div>
	{/if}
</ClosableModal>

<ClosableModal bind:isOpen={showRejectModal} headerText="Odrzuć wniosek" buttonCaption="Odrzuć" onClick={handleReject}>
	<p>Czy na pewno chcesz odrzucić ten wniosek?</p>
	<CustomFormTextarea caption="Powód odrzucenia (wymagany)" bind:value={rejectionReason} size={3} />

	{#if error}
		<div class="alert alert-danger text-white text-sm mt-3">{error}</div>
	{/if}
</ClosableModal>
