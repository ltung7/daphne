<script>
	import HandoverProtocol from "$lib/components/documents/NewHandoverProtocol.svelte";
	import IconLink from '$lib/misc/IconLink.svelte';
	import PageTitle from '$lib/misc/PageTitle.svelte';
</script>

<PageTitle title="Nowe wydanie pojazdu" subtitle="Wprowadź szczegóły wydania pojazdu">
	<IconLink icon="left" caption="Powrót do listy" href="/handovers" />
</PageTitle>

<HandoverProtocol />