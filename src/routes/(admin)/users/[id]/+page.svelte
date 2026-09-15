<script lang="ts">
	import { untrack } from 'svelte';
	import type { PageProps } from './$types';
	import PageTitle from '$lib/misc/PageTitle.svelte';
	import SectionCard from '$lib/misc/SectionCard.svelte';
	import IconLink from '$lib/misc/IconLink.svelte';
	import { plTimezone } from '$lib/utils/tz';
	import CustomFormRoleSelect from '$lib/form/CustomFormRoleSelect.svelte';
	import ResetPasswordSection from '$lib/components/ResetPasswordSection.svelte';
	import { confirmSuccess, internal } from '$lib/nav/internal';

	let { data }: PageProps = $props();
	let user: App.User = $state(untrack(() => data.user));

	const handleRoleChange = async (newRole: App.User['role'] | Event) => {
		const role = typeof newRole === 'string' ? newRole : user.role;
		const response = await confirmSuccess(internal.postApi({ role }, 'patch'));
		if (response?.user) {
			user = response.user;
		} else {
			user.role = role;
		}
	};
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
			<div class="text-muted xsmall">Utworzono</div>
			<div class="fw-bold text-dark">{plTimezone(user.timestamp)}</div>
		</div>
		<div class="col-12 col-md-6">
			<div class="text-muted xsmall">Zaktualizowano</div>
			<div class="fw-bold text-dark">{plTimezone(user.updatedAt)}</div>
		</div>
	</div>
</SectionCard>

<SectionCard title="Rola">
	<CustomFormRoleSelect bind:value={user.role} readonly={data._user?.role !== 'admin'} onclick={handleRoleChange} />
</SectionCard>

<ResetPasswordSection />