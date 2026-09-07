<script lang="ts">
	import DatatableWrapper from '$lib/misc/DatatableWrapper.svelte';
	import { onMount } from 'svelte';
	import TooltipSquareIconLink from '$lib/misc/TooltipSquareIconLink.svelte';
	import { internal } from '$lib/nav/internal';
	import HandoverStatus from '$lib/misc/HandoverStatus.svelte';
	import TooltipSquareIconButton from '$lib/misc/TooltipSquareIconButton.svelte';
	import IconLink from '$lib/misc/IconLink.svelte';
	import PageTitle from '$lib/misc/PageTitle.svelte';

	let handovers: DocumentGenerator.HandoverDocumentRecord[] = $state([]);
	let loaded = $state(false);

	const loadData = () => {
		internal.getApi().then((response) => {
			handovers = response.handovers;
			loaded = true;
		});
	};

	const headers: SvelteCustom.DatatableHeaders<keyof DocumentGenerator.HandoverDocumentRecord> = [
		[ 'date', 'Data' ],
		[ 'type', 'Rodzaj' ],
		[ 'closed', 'Status' ],
		[ 'registrationNumber', 'Numer rejestracyjny' ],
		[ 'driverName', 'Kierowca' ],
		[ 'visual', 'Notatki' ]
	];

	const removeHandover = async (id: string) => {
		const response = await internal.delApi({ id });
		if (response.success) {
			handovers = handovers.filter((item) => item.id !== id);
		}
	};

	onMount(loadData);
</script>

<PageTitle title="Wydania pojazdów" subtitle="Lista protokołów zdawczo odboirczych">
	<IconLink icon="add" caption="Nowy protokół" href="/handovers/new" />
</PageTitle>

<div class="card">
	<div class="card-body text-center">
		<DatatableWrapper {loaded} data={handovers} {headers} hasTimestamp>
			{#snippet row(row)}
				<td class="py-1">
					<div class="flex-center">
						<TooltipSquareIconLink icon="link" hoverText="Pokaż szczegóły" href="/handovers/{row.id}" size={5} />
						<TooltipSquareIconButton icon="trash" hoverText="Usuń" color="danger" onClick={() => removeHandover(row.id)} size={5} />
					</div>
				</td>
				<td>{row.date}</td>
				<td>
					{#if row.type === 'assign'}
						Wydanie
					{:else if row.type === 'return'}
						Zwrot
					{:else}
						Jednostronny odbiór
					{/if}
				</td>
				<td class="py-1"><HandoverStatus handover={row} /></td>
				<td>{row.registrationNumber}</td>
				<td>{row.driverName}</td>
				<td>{row.visual}</td>
			{/snippet}
		</DatatableWrapper>
	</div>
</div>
