<script lang="ts">
	import NewReturnHandoverProtocol from '$lib/components/documents/NewReturnHandoverProtocol.svelte';
	import PageTitle from '$lib/misc/PageTitle.svelte';
	import IconLink from '$lib/misc/IconLink.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
</script>

<PageTitle title="Zwrot pojazdu" subtitle={`Wprowadź szczegóły zwrotu pojazdu dla ${data.handover.registrationNumber}`} back={`/handovers/${data.handover.id}`}>
	<div class="d-flex gap-2">
		<IconLink icon="garage-car" color="danger" caption="Odbiór jednostronny" href={`/handovers/${data.handover.id}/unilateral`} />
		<IconLink icon="left" color="dark" caption="Powrót" href={`/handovers/${data.handover.id}`} />
	</div>
</PageTitle>

<NewReturnHandoverProtocol initialHandover={data.handover} />
