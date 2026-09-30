<script lang="ts">
	import { onMount, untrack } from 'svelte';
	import type { PageProps } from './$types';
	import SectionCard from '$lib/misc/SectionCard.svelte';
	import PageTitle from '$lib/misc/PageTitle.svelte';
	import { formatDateTimePL } from '$lib/utils/dateFormat';
	import IncidentMetadata from '../../incidents/[id]/IncidentMetadata.svelte';
	import { internal } from '$lib/nav/internal';

	let { data }: PageProps = $props();
	let item: App.InAppNotification = $state(untrack(() => data.notification));

	onMount(() => {
		if (!item.read) {
			const readTimestamp = Date.now();
			item.read = readTimestamp;
			internal.postApi({ data: { read: readTimestamp } }, 'patch').catch(console.error);
		}
	});
</script>

<PageTitle title={item.title} subtitle={formatDateTimePL(item.timestamp)} back="/notifications" />

<SectionCard title="Treść powiadomienia">
	{@html item.body}
</SectionCard>

<IncidentMetadata metadata={item.metadata} />
