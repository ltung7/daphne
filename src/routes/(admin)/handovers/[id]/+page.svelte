<script lang="ts">
	import ExistingHandoverProtocol from '$lib/components/documents/ExistingHandoverProtocol.svelte';
	import EditAssignmentHandoverProtocol from '$lib/components/documents/EditAssignmentHandoverProtocol.svelte';
	import EditReturnHandoverProtocol from '$lib/components/documents/EditReturnHandoverProtocol.svelte';
    import type { PageProps } from './$types';
	import PageTitle from '$lib/misc/PageTitle.svelte';
	import { untrack } from 'svelte';
	import PageTopActions from '$lib/misc/PageTopActions.svelte';
	import IconLink from '$lib/misc/IconLink.svelte';

    let { data }: PageProps = $props();

	const title = untrack(() => data.handover.type === 'assign'
		? 'Protokół wydania pojazdu'
		: data.handover.type === 'return'
			? 'Protokół zwrotu pojazdu'
			: 'Protokół jednostronnego odbioru pojazdu');
</script>

<PageTitle title={title} subtitle={data.handover.id} back="/handovers" />

{#if data.handover.type === 'assign' && data.handover.closed !== false && !data.handover.cancelled}
	<PageTopActions>
		<IconLink icon="undo" caption="Zwrot pojazdu" size={6} href="/handovers/{data.handover.id}/return" />
		<IconLink icon="exclamation" caption="Odbiór jednostronny" outline color="danger" size={6} href="/handovers/{data.handover.id}/unilateral" />
	</PageTopActions>
{/if}

{#if data.handover.handoverId && data.handover.type !== 'assign'}
	<PageTopActions>
		<IconLink icon="arrow-left" caption="Protokół wydania" size={6} href="/handovers/{data.handover.handoverId}" />
	</PageTopActions>
{/if}

{#if data.handover.closed !== false || data.handover.cancelled}
	<ExistingHandoverProtocol handoverProtocol={data.handover} />
{:else if data.handover.type === 'assign'}
	<EditAssignmentHandoverProtocol handoverProtocol={data.handover} admin={data.admin} />
{:else}
	<EditReturnHandoverProtocol handoverProtocol={data.handover} admin={data.admin} />
{/if}