<script lang="ts">
	import ClosableModal from '$lib/misc/ClosableModal.svelte';
	import IconButton from '$lib/misc/IconButton.svelte';
	import SectionCard from '$lib/misc/SectionCard.svelte';
	import { internal, confirmSuccess } from '$lib/nav/internal';
	import { m } from '$lib/paraglide/messages.js';
	import { wrapLoader } from '$lib/nav/loader';

	let showPassword = $state(false);
	let generatedPassword = $state('');
	let showResetLink = $state(false);
	let generatedResetLink = $state('');
	let copied = $state(false);

	async function handleResetPassword() {
		const result = await confirmSuccess(wrapLoader(internal.postApi({ action: 'reset_password' })), m.auth_password_reset_success());
		if (result?.success && result.password) {
			generatedPassword = result.password;
			showPassword = true;
		}
	}

	async function handleSendResetEmail() {
		const result = await confirmSuccess(wrapLoader(internal.postApi({ action: 'send_reset_email' })), m.auth_reset_link_sent_toast());
		if (result?.success && result.resetLink) {
			generatedResetLink = result.resetLink;
			showResetLink = true;
		}
	}

	function copyString(text: string) {
		navigator.clipboard.writeText(text);
		copied = true;
		setTimeout(() => {
			copied = false;
		}, 5000);
	}
</script>

<SectionCard title={m.password_reset_title()}>
	<div class="gap-2 d-flex">
		<IconButton icon="password" onclick={handleResetPassword} size={5} color="success" caption={m.generate_new_password()} />
		<IconButton icon="envelope" onclick={handleSendResetEmail} size={5} color="dark" caption={m.auth_send_reset_link()} />
	</div>
</SectionCard>

<ClosableModal bind:isOpen={showPassword} headerText={m.auth_password_reset_success()} centered>
	<div class="d-flex align-items-center justify-content-center flex-column mw-100 gap-2">
		<div class="fw-bold">{m.new_password_label()}</div>
		<code class="ms-2 bg-light rounded px-2 py-1" title="password">{generatedPassword}</code>
		<button class="btn btn-sm btn-outline-secondary mb-0 py-1" onclick={() => copyString(generatedPassword)} type="button"> {copied ? m.copy_button_copied() : m.copy_button()} </button>
		<div class="text-muted xsmall text-center">{m.password_reset_message()}</div>
	</div>
</ClosableModal>

<ClosableModal bind:isOpen={showResetLink} headerText={m.auth_reset_link()} centered>
	<div class="d-flex align-items-center justify-content-center flex-column mw-100 gap-2">
		<div class="fw-bold">{m.auth_reset_link()}:</div>
		<code class="ms-2 bg-light rounded px-2 py-1 text-nowrap overflow-hidden text-truncate" title="link" style="max-width: 100%;">{generatedResetLink}</code>
		<button class="btn btn-sm btn-outline-secondary mb-0 py-1" onclick={() => copyString(generatedResetLink)} type="button"> {copied ? m.copy_button_copied() : m.copy_button()} </button>
		<div class="text-muted xsmall mt-2 text-center">{m.auth_reset_link_expire()}</div>
	</div>
</ClosableModal>
