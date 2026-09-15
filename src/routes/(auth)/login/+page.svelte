<script lang="ts">
	import { page } from '$app/state';
	import { addToast } from '$lib/toast';
	import { internal } from '$lib/nav/internal.js';
	import type { Auth } from 'firebase/auth';
	import { onMount } from 'svelte';
	import { m } from '$lib/paraglide/messages.js';

	let email = $state('');
	let password = $state('');
	let loading = $state(false);
	let googleLoading = $state(false);
	let auth: Auth | null = $state(null);
	let googleProvider: any = $state(null);

	const revoked = page.url.searchParams.get('revoked') === 'true';
	const loggedOut = page.url.searchParams.get('loggedOut') === 'true';

	if (revoked) {
		addToast(m.auth_account_revoked(), 'danger');
	}

	if (loggedOut) {
		addToast(m.auth_logged_out_success(), 'success');
	}

	async function handleEmailSignIn() {
		if (!email || !password) {
			addToast(m.auth_fill_all_fields(), 'danger');
			return;
		}

		loading = true;

		if (!auth) {
			console.error('Firebase not initialized');
			loading = false;
			return;
		}
		try {
			const { signInWithEmailAndPassword } = await import('firebase/auth');
			const userCredential = await signInWithEmailAndPassword(auth, email, password);
			const idToken = await userCredential.user.getIdToken();

			const result = await internal.postApi({ action: 'signin', idToken });

			if (result?.redirect) {
				window.location.href = result.redirect;
			}
		} catch (err: any) {
			addToast(err.message || m.auth_invalid_email_or_password(), 'danger');
		} finally {
			loading = false;
		}
	}

	async function handleGoogleSignIn() {
		if (!auth || !googleProvider) {
			console.error('Firebase not initialized');
			return;
		}

		googleLoading = true;
		try {
			const { signInWithPopup } = await import('firebase/auth');
			const result = await signInWithPopup(auth, googleProvider);
			const idToken = await result.user.getIdToken();

			const response = await internal.postApi({ action: 'google', idToken });

			if (response?.redirect) {
				window.location.href = response.redirect;
			}
		} catch (err: any) {
			if (err.code !== 'auth/popup-closed-by-user') {
				addToast(err.message || m.auth_google_login_error(), 'danger');
			}
		} finally {
			googleLoading = false;
		}
	}

	onMount(async () => {
		// Load Firebase client auth only in the browser
		const { getAuth, GoogleAuthProvider } = await import('firebase/auth');
		const { app } = await import('$lib/firebase/client');
		if (app) {
			auth = getAuth(app);
			// Initialize Google provider
			googleProvider = new GoogleAuthProvider();
			// Restrict to specific domains (handled by server-side verify)
			googleProvider.setCustomParameters({
				prompt: 'select_account'
			});
		}
	});
</script>

<h2 class="text-center mb-4">{m.auth_login_heading()}</h2>

<div>
	<div class="mb-3">
		<label for="email" class="form-label">{m.auth_email_label()}</label>
		<input type="email" id="email" class="form-control" bind:value={email} placeholder="jan@kowalski.pl" required autocomplete="email" disabled={loading} />
	</div>

	<div class="mb-3">
		<label for="password" class="form-label">{m.auth_password_label()}</label>
		<input type="password" id="password" class="form-control" bind:value={password} placeholder="••••••••" required autocomplete="current-password" disabled={loading} />
	</div>

	<button type="button" class="btn btn-primary w-100" disabled={loading} onclick={handleEmailSignIn}>
		{loading ? m.auth_logging_in() : m.auth_login_button()}
	</button>
</div>

<div class="text-center mt-3">
	<a href="/password-reset" class="text-decoration-none">{m.auth_forgot_password()}</a>
</div>

<div class="divider my-4">
	<span>{m.auth_or_divider()}</span>
</div>

<button type="button" class="btn btn-outline-secondary w-100 d-flex align-items-center justify-content-center gap-2" onclick={handleGoogleSignIn} disabled={googleLoading}>
	<svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
		<path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
		<path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
		<path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
		<path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
	</svg>
	{googleLoading ? m.auth_logging_in() : m.auth_login_with_google()}
</button>

<style>
	.divider {
		display: flex;
		align-items: center;
		color: #6c757d;
		font-size: 0.875rem;
	}

	.divider::before,
	.divider::after {
		content: '';
		flex: 1;
		border-bottom: 1px solid #dee2e6;
	}

	.divider span {
		padding: 0 1rem;
	}
</style>
