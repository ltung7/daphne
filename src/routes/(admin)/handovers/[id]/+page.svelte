<script lang="ts">
	import ExistingHandoverProtocol from '$lib/components/documents/ExistingHandoverProtocol.svelte';
    import type { PageProps } from './$types';
	import PageTitle from '$lib/misc/PageTitle.svelte';
	import { plTimezone } from '$lib/utils/tz';

    let { data }: PageProps = $props();
</script>

<PageTitle title="Protokół zdawczy" subtitle={data.handover.id} back="/handovers" />

<ExistingHandoverProtocol handoverProtocol={data.handover} />