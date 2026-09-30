<script lang="ts">
	import DatatableWrapper from '$lib/misc/DatatableWrapper.svelte';
	import { onMount } from 'svelte';
	import TooltipSquareIconLink from '$lib/misc/TooltipSquareIconLink.svelte';
	import { fetchNotifications } from '$lib/nav/fetchData';
	import NotificationStatus from '$lib/components/notification/NotificationStatus.svelte';
	import PageTitle from '$lib/misc/PageTitle.svelte';
    import { formatDateTimePL } from '$lib/utils/dateFormat';

	let items: App.InAppNotification[] = $state([]);
	let loaded = $state(false);

	const loadItems = () => {
		fetchNotifications().then((list) => {
			items = list;
			loaded = true;
		});
	};

	const headers: SvelteCustom.DatatableHeaders<keyof App.InAppNotification> = [
		[ 'title', 'Tytuł' ],
		[ 'read', 'Status' ],
        [ 'timestamp', 'Data' ]
	];

	onMount(loadItems);
</script>

<PageTitle title="Powiadomienia" subtitle="Lista powiadomień" />

<div class="card">
	<div class="card-body text-center p-0">
		<DatatableWrapper {loaded} data={items} {headers}>
			{#snippet row(row)}
				<td class="py-1">
					<TooltipSquareIconLink icon="link" hoverText="Pokaż szczegóły" href="/notifications/{row.id}" size={5} />
				</td>
				<td>{row.title}</td>
				<td class="py-1"><NotificationStatus status={row.read} /></td>
                <td>{formatDateTimePL(row.timestamp)}</td>
			{/snippet}
		</DatatableWrapper>
	</div>
</div>
