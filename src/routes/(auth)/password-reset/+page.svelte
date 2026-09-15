<script lang="ts">
	import { page } from '$app/state';
	import { addToast } from '$lib/toast';
	import { internal } from '$lib/nav/internal.js';
	import { m } from '$lib/paraglide/messages.js';

	let email = $state('');
	let loading = $state(false);
	let sent = $state(false);

	const sentParam = page.url.searchParams.get('sent') === 'true';
	if (sentParam) {
		sent = true;
	}

	async function handleSubmit() {
		if (!email) {
			addToast(m.auth_enter_email(), 'danger');
			return;
		}

		loading = true;
		try {
			const result = await internal.postApi({ email });

			if (!result?.success) {
				throw new Error(result?.message || m.auth_send_error());
			}

			sent = true;
			addToast(m.auth_reset_link_sent_toast(), 'success');
		} catch (err: any) {
			addToast(err.message || m.auth_failed_to_send_link(), 'danger');
		} finally {
			loading = false;
		}
	}
</script>

<h2 class="text-center mb-4">{m.auth_reset_password_title()}</h2>

{#if !sent}
	<p class="text-center text-muted mb-4">
		{m.auth_reset_password_description()}
	</p>

	<form onsubmit={handleSubmit}>
		<div class="mb-3">
			<label for="email" class="form-label">{m.auth_email_label()}</label>
			<input type="email" id="email" name="email" class="form-control" bind:value={email} placeholder={m.auth_email_placeholder()} required autocomplete="email" disabled={loading} />
		</div>

		<button type="submit" class="btn btn-primary w-100" disabled={loading}>
			{loading ? m.auth_sending() : m.auth_send_reset_link()}
		</button>
	</form>
{:else}
	<div class="text-center">
		<svg class="text-success mb-3" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
			<path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
			<path stroke-linecap="round" stroke-linejoin="round" d="M12 21C16.9706 21 21 16.9706 21 12C21 7.02944 16.9706 3 12 3C7.02944 3 3 7.02944 3 12C3 16.9706 7.02944 21 12 21Z" />
		</svg>
		<h4>{m.auth_check_inbox_title()}</h4>
		<p class="text-muted">
			{m.auth_reset_link_sent()} <strong>{email}</strong>.
		</p>
		<p class="text-muted small">
			{m.auth_check_spam_folder()}
		</p>
		<a href="/login" class="btn btn-link mt-3">{m.auth_back_to_login()}</a>
	</div>
{/if}
