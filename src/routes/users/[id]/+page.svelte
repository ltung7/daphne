<script lang="ts">
	import { untrack } from 'svelte';
	import type { PageProps } from './$types';
	import PageTitle from '$lib/misc/PageTitle.svelte';
	import SectionCard from '$lib/misc/SectionCard.svelte';
	import IconLink from '$lib/misc/IconLink.svelte';
	import { plTimezone } from '$lib/utils/tz';

	let { data }: PageProps = $props();
	let user: App.User = $state(untrack(() => data.user));
</script>

<PageTitle title="Użytkownik {user.name}" subtitle="Rola: {user.role}">
	<IconLink icon="left" caption="Powrót do listy" href="/users" />
</PageTitle>

<SectionCard title="Dane użytkownika">
	<div class="row mb-3">
		<div class="col-12 col-md-6">
			<div class="text-muted xsmall">Imię i nazwisko</div>
			<div class="fw-bold text-dark">{user.name}</div>
		</div>
		<div class="col-12 col-md-6">
			<div class="text-muted xsmall">Email</div>
			<div class="fw-bold text-dark">{user.email}</div>
		</div>
	</div>
	<div class="row mb-3">
		<div class="col-12 col-md-6">
			<div class="text-muted xsmall">Rola</div>
			<div class="fw-bold text-dark">{user.role}</div>
		</div>
		<div class="col-12 col-md-6">
			<div class="text-muted xsmall">Język</div>
			<div class="fw-bold text-dark">{user.preferredLanguage}</div>
		</div>
	</div>
	<div class="row mb-3">
		<div class="col-12 col-md-6">
			<div class="text-muted xsmall">Utworzono</div>
			<div class="fw-bold text-dark">{plTimezone(user.timestamp)}</div>
		</div>
		<div class="col-12 col-md-6">
			<div class="text-muted xsmall">Zaktualizowano</div>
			<div class="fw-bold text-dark">{plTimezone(user.updatedAt)}</div>
		</div>
	</div>
</SectionCard>