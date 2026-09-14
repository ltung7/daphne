<script lang="ts">
	import DatatableWrapper from '$lib/misc/DatatableWrapper.svelte';
	import { onMount } from 'svelte';
	import TooltipSquareIconLink from '$lib/misc/TooltipSquareIconLink.svelte';
	import PageTitle from '$lib/misc/PageTitle.svelte';
	import IconLink from '$lib/misc/IconLink.svelte';
	import { internal } from '$lib/nav/internal';

	let inspections: DocumentGenerator.InspectionDocumentRecord[] = $state([]);
	let loaded = $state(false);

	const fetchInspections = async () => {
		const response = await internal.getApi();
		if (Array.isArray(response.inspections)) return response.inspections;
		return [];
	}

	const loadInspections = () => {
		fetchInspections().then((list) => (inspections = list));
	};

	const headers: SvelteCustom.DatatableHeaders<keyof DocumentGenerator.InspectionDocumentRecord> = [
		[ 'registrationNumber', 'Numer rejestracyjny' ],
		[ 'assignedDriverName', 'Kierowca' ],
		[ 'monthly', 'Typ' ],
		[ 'timestamp', 'Data' ],
		[ 'uploader', 'Przesłał' ]
	];

	onMount(loadInspections);
</script>

<PageTitle title="Inspekcje" subtitle="Lista inspekcji pojazdów">
	<IconLink icon="add" caption="Nowa inspekcja" href="/inspections/new" />
</PageTitle>

<div class="card">
	<div class="card-body text-center">
		<DatatableWrapper {loaded} data={inspections} {headers}>
			{#snippet row(row)}
				<td class="py-1">
					<TooltipSquareIconLink icon="link" hoverText="Pokaż szczegóły" href="/inspections/{row.id}" size={5} />
				</td>
				<td class="fw-bold">{row.registrationNumber}</td>
				<td>{row.assignedDriverName || 'Brak'}</td>
				<td>{row.monthly ? 'Miesięczna' : 'Codzienna'}</td>
				<td>{new Date(row.timestamp).toLocaleDateString('pl-PL')}</td>
				<td>{row.uploader}</td>
			{/snippet}
		</DatatableWrapper>
	</div>
</div>