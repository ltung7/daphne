<script lang="ts">
	import { cleanUser } from '$lib/assets/cleanItems';
	import { newUserSchema } from '$lib/assets/zodschemas/newuser.zod';
	import CardForm from '$lib/form/CardForm.svelte';
	import CustomFormText from '$lib/form/CustomFormText.svelte';
	import IconLink from '$lib/misc/IconLink.svelte';
	import PageTitle from '$lib/misc/PageTitle.svelte';
	import { goto } from '$app/navigation';
	import ClosableModal from '$lib/misc/ClosableModal.svelte';
	import CustomFormRoleSelect from '$lib/form/CustomFormRoleSelect.svelte';
	import CustomFormCheckSwitch from '$lib/form/CustomFormCheckSwitch.svelte';

	let user: App.User = $state({ ...cleanUser });
	let createdId: string | undefined = $state();
	let showCreated = $state(false);

	const onResponse = async (response: any) => {
		if (response.id) {
			createdId = response.id;
			showCreated = true;
		}
	};

	const onReset = () => {
		user = { ...cleanUser };
	};

	const beforeSubmit = (u: App.User): Partial<App.User> => {
		return {
			name: u.name.trim(),
			email: u.email.trim().toLowerCase()
		};
	};
</script>

<PageTitle title="Nowy użytkownik" subtitle="Utwórz nowego użytkownika systemu">
	<IconLink icon="left" caption="Powrót do listy" href="/users" />
</PageTitle>

<CardForm item={user} cleanItem={cleanUser} {onResponse} {onReset} {beforeSubmit} schema={newUserSchema} name="user">
	{#snippet children({ errors, touch })}
		<div class="row">
			<div class="col-12 col-md-6">
				<CustomFormText bind:value={user.name} caption="Imię i nazwisko" error={errors.name} onblur={() => touch('name')} />
				<CustomFormText bind:value={user.email} caption="Email" error={errors.email} onblur={() => touch('email')} placeholder="user@example.com" />
				<label for="#" class="form-label small mb-1">Podpisywanie dokumentów</label>
				<CustomFormCheckSwitch bind:checked={user.canSignHandovers} caption="Może podpisywać protokoły zdawcze" onChange={() => touch('canSignHandovers')} />
			</div>
			<div class="col-12 col-md-6">
				<CustomFormRoleSelect bind:value={user.role} />
			</div>
		</div>
	{/snippet}
</CardForm>

<ClosableModal bind:isOpen={showCreated} headerText="Użytkownik dodany" buttonCaption="Przejdź do użytkownika" onClick={() => createdId && goto('/users/' + createdId)}>
	<div class="text-center">
		<h5 class="text-success">Użytkownik został dodany</h5>
		<div class="fw-bold">ID: {createdId}</div>
	</div>
</ClosableModal>
