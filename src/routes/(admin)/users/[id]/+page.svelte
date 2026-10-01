<script lang="ts">
	import { untrack } from 'svelte';
	import type { PageProps } from './$types';
	import PageTitle from '$lib/misc/PageTitle.svelte';
	import SectionCard from '$lib/misc/SectionCard.svelte';
	import { plTimezone } from '$lib/utils/tz';
	import CustomFormRoleSelect from '$lib/form/CustomFormRoleSelect.svelte';
	import CustomFormCheckSwitch from '$lib/form/CustomFormCheckSwitch.svelte';
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

	const handleCanSignHandoversChange = async (checked: boolean) => {
		const response = await confirmSuccess(internal.postApi({ canSignHandovers: checked }, 'patch'));
		if (response?.user) {
			user = response.user;
		} else {
			user.canSignHandovers = checked;
		}
	};

	const handleCanApproveSettlementsChange = async (checked: boolean) => {
		const response = await confirmSuccess(internal.postApi({ canAproveSettlements: checked }, 'patch'));
		if (response?.user) {
			user = response.user;
		} else {
			user.canAproveSettlements = checked;
		}
	};
</script>

<PageTitle title="Użytkownik {user.name}" subtitle="Rola: {user.role}" back="/users" />

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

<SectionCard title="Uprawnienia">
	<div class="row mb-3">
		<div class="col-12">
			<CustomFormCheckSwitch
				bind:checked={user.canSignHandovers}
				caption="Może podpisywać protokoły przekazania pojazdu"
				onChange={(e) => handleCanSignHandoversChange((e.target as HTMLInputElement).checked)}
			/>
		</div>
	</div>
	<div class="row mb-3">
		<div class="col-12">
			<CustomFormCheckSwitch
				bind:checked={user.canAproveSettlements}
				caption="Może zatwierdzać rozliczenia kierowców"
				onChange={(e) => handleCanApproveSettlementsChange((e.target as HTMLInputElement).checked)}
			/>
		</div>
	</div>
</SectionCard>

<ResetPasswordSection />