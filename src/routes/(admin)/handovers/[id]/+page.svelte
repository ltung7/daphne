<script lang="ts">
	import ExistingHandoverProtocol from '$lib/components/documents/ExistingHandoverProtocol.svelte';
    import type { PageProps } from './$types';

    let { data }: PageProps = $props();
</script>

<ExistingHandoverProtocol handoverProtocol={data.handover} />