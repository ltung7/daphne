<script lang="ts">
	import DatatableWrapper from '$lib/misc/DatatableWrapper.svelte';
	import { onMount } from 'svelte';
	import TooltipSquareIconLink from '$lib/misc/TooltipSquareIconLink.svelte';
	import { internal } from '$lib/nav/internal';
	import PageTitle from '$lib/misc/PageTitle.svelte';

	let earlySettlements: DriverBalance.EarlySettlement[] = $state([]);
	let loaded = $state(false);

	const loadData = () => {
		internal.getApi().then((response) => {
			earlySettlements = response.earlySettlements;
			loaded = true;
		});
	};

	const headers: SvelteCustom.DatatableHeaders<keyof DriverBalance.EarlySettlement> = [
		[ 'createdAt', 'Data zgłoszenia' ],
		[ 'driverId', 'Kierowca (ID)' ],
		[ 'requestedAmount', 'Kwota wnioskowana' ],
		[ 'fee', 'Prowizja' ],
		[ 'actualPayout', 'Do wypłaty' ],
		[ 'status', 'Status' ]
	];

	function getStatusBadgeClass(status: string) {
		switch(status) {
			case 'requested': return 'bg-info';
			case 'approved': return 'bg-success';
			case 'rejected': return 'bg-danger';
			case 'cancelled': return 'bg-secondary';
			default: return 'bg-dark';
		}
	}

	function getStatusLabel(status: string) {
		switch(status) {
			case 'requested': return 'Oczekujący';
			case 'approved': return 'Zatwierdzony';
			case 'rejected': return 'Odrzucony';
			case 'cancelled': return 'Anulowany';
			default: return status;
		}
	}

	function formatDate(timestamp: number) {
		return new Date(timestamp).toLocaleString('pl-PL');
	}

	onMount(loadData);
</script>

<PageTitle title="Wcześniejsze rozliczenia" subtitle="Lista wniosków o wcześniejsze rozliczenie">
</PageTitle>

<div class="card">
	<div class="card-body text-center">
		<DatatableWrapper {loaded} data={earlySettlements} {headers} hasTimestamp>
			{#snippet row(row)}
				<td class="py-1">
					<div class="flex-center">
						<TooltipSquareIconLink icon="link" hoverText="Pokaż szczegóły" href="/earlysettlements/{row.id}" size={5} />
					</div>
				</td>
				<td>{formatDate(row.createdAt)}</td>
				<td>
					<a href="/drivers/{row.driverId}">{row.createdByName || row.driverId}</a>
				</td>
				<td>{row.requestedAmount.toFixed(2)} PLN</td>
				<td class="text-danger">-{row.fee.toFixed(2)} PLN</td>
				<td class="text-success fw-bold">{row.actualPayout.toFixed(2)} PLN</td>
				<td>
					<span class="badge {getStatusBadgeClass(row.status)}">
						{getStatusLabel(row.status)}
					</span>
				</td>
			{/snippet}
		</DatatableWrapper>
	</div>
</div>