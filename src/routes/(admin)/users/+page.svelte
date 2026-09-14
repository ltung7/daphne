<script lang="ts">
	import DatatableWrapper from '$lib/misc/DatatableWrapper.svelte';
	import { onMount } from 'svelte';
	import TooltipSquareIconLink from '$lib/misc/TooltipSquareIconLink.svelte';
	import PageTitle from '$lib/misc/PageTitle.svelte';
	import IconLink from '$lib/misc/IconLink.svelte';
	import { internal } from '$lib/nav/internal';

	let users: App.User[] = $state([]);
	let loaded = $state(false);

	const fetchUsers = async () => {
		const response = await internal.getApi();
		if (Array.isArray(response.users)) return response.users;
		return [];
	}

	const loadUsers = () => {
		fetchUsers().then((list) => (users = list));
	};

	const headers: SvelteCustom.DatatableHeaders<keyof App.User> = [
		[ 'name', 'Imię i nazwisko' ],
		[ 'email', 'Email' ],
		[ 'role', 'Rola' ],
	];

	onMount(loadUsers);
</script>

<PageTitle title="Użytkownicy" subtitle="Lista użytkowników systemu">
	<IconLink icon="add" caption="Nowy użytkownik" href="/users/new" />
</PageTitle>

<div class="card">
	<div class="card-body text-center">
		<DatatableWrapper {loaded} data={users} {headers}>
			{#snippet row(row)}
				<td class="py-1">
					<TooltipSquareIconLink icon="link" hoverText="Pokaż szczegóły" href="/users/{row.id}" size={5} />
				</td>
				<td class="fw-bold">{row.name}</td>
				<td>{row.email}</td>
				<td>{row.role}</td>
			{/snippet}
		</DatatableWrapper>
	</div>
</div>