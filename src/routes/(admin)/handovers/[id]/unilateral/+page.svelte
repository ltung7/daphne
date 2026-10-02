<script lang="ts">
	import NewReturnHandoverProtocol from '$lib/components/documents/NewReturnHandoverProtocol.svelte';
	import PageTitle from '$lib/misc/PageTitle.svelte';
	import IconLink from '$lib/misc/IconLink.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
</script>

<PageTitle
	title="Odbiór jednostronny pojazdu"
	subtitle={`Dokument jednostronnego odbioru dla ${data.handover.registrationNumber}`}
	back={`/handovers/${data.handover.id}`}
>
	<div class="d-flex gap-2">
		<IconLink icon="arrow-return-left" color="primary" caption="Zwrot standardowy" href={`/handovers/${data.handover.id}/return`} />
		<IconLink icon="left" color="dark" caption="Powrót" href={`/handovers/${data.handover.id}`} />
	</div>
</PageTitle>

<NewReturnHandoverProtocol
	initialHandover={data.handover}
	unilateral={true}
/>
