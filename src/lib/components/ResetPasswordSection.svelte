<script lang="ts">
	import SectionCard from '$lib/misc/SectionCard.svelte';
	import { internal, confirmSuccess } from '$lib/nav/internal';
	import { m } from '$lib/paraglide/messages.js';
	
	let showPassword = $state(false);
	let generatedPassword = $state('');
	let showResetLink = $state(false);
	let generatedResetLink = $state('');

	async function handleResetPassword() {
		const result = await confirmSuccess(internal.postApi({ action: 'reset_password' }), m.auth_password_reset_success());
		if (result?.success && result.password) {
			generatedPassword = result.password;
			showPassword = true;
		}
	}

	async function handleSendResetEmail() {
		const result = await confirmSuccess(internal.postApi({ action: 'send_reset_email' }), m.auth_reset_link_sent_toast());
		if (result?.success && result.resetLink) {
			generatedResetLink = result.resetLink;
			showResetLink = true;
		}
	}
</script>

<SectionCard title={m.password_reset_title()}>
	<div>
		<button class="btn btn-warning me-2" onclick={handleResetPassword} type="button"> {m.generate_new_password()} </button>
		<button class="btn btn-info" onclick={handleSendResetEmail} type="button"><!-- TODO: add translation --> Wyślij email do resetowania hasła </button>
	</div>
	{#if showPassword}
		<div class="alert alert-success mt-3">
			<div class="d-flex align-items-center justify-content-between">
				<div>
					<strong>{m.new_password_label()}</strong>
					<code class="ms-2">{generatedPassword}</code>
				</div>
				<button class="btn btn-sm btn-outline-secondary" onclick={() => navigator.clipboard.writeText(generatedPassword)} type="button"> {m.copy_button()} </button>
			</div>
			<div class="text-muted xsmall mt-2">{m.password_reset_message()}</div>
		</div>
	{/if}
	{#if showResetLink}
		<div class="alert alert-success mt-3">
			<div class="d-flex align-items-center justify-content-between flex-wrap gap-2">
				<div>
					<strong>{m.auth_reset_link()}</strong>
					<code class="ms-2">{generatedResetLink}</code>
				</div>
				<button class="btn btn-sm btn-outline-secondary" onclick={() => navigator.clipboard.writeText(generatedResetLink)} type="button"> {m.copy_button()} </button>
			</div>
			<div class="text-muted xsmall mt-2">{m.auth_reset_link_expire()}</div>
		</div>
	{/if}
</SectionCard>
