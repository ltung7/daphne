<script lang="ts">
	import { enhance } from '$app/forms';
	import { page } from '$app/state';
	import { addToast } from '$lib/toast';

	let email = $state('');
	let loading = $state(false);
	let sent = $state(false);

	const sentParam = page.url.searchParams.get('sent') === 'true';
	if (sentParam) {
		sent = true;
	}

	async function handleSubmit() {
		if (!email) {
			addToast('Podaj adres email', 'danger');
			return;
		}

		loading = true;
		try {
			const formData = new FormData();
			formData.append('email', email);

			const response = await fetch('/password-reset', {
				method: 'POST',
				body: formData
			});

			const result = await response.json();

			if (!response.ok) {
				throw new Error(result.message || 'Błąd wysyłki');
			}

			sent = true;
			addToast('Link do resetowania hasła został wysłany na Twój email', 'success');
		} catch (err: any) {
			addToast(err.message || 'Nie udało się wysłać linku', 'danger');
		} finally {
			loading = false;
		}
	}
</script>

<div class="container">
	<div class="row justify-content-center">
		<div class="col-md-6 col-lg-5">
			<div class="card mt-5">
				<div class="card-body p-4">
					<h2 class="text-center mb-4">Resetuj hasło</h2>

					{#if !sent}
						<p class="text-center text-muted mb-4">
							Podaj swój adres email, a wyślemy Ci link do resetowania hasła.
						</p>

						<form method="POST" use:enhance>
							<div class="mb-3">
								<label for="email" class="form-label">Email</label>
								<input
									type="email"
									id="email"
									name="email"
									class="form-control"
									bind:value={email}
									placeholder="jan@kowalski.pl"
									required
									autocomplete="email"
									disabled={loading}
								/>
							</div>

							<button
								type="submit"
								class="btn btn-primary w-100"
								disabled={loading}
							>
								{loading ? 'Wysyłanie...' : 'Wyślij link resetujący'}
							</button>
						</form>
					{:else}
						<div class="text-center">
							<svg class="text-success mb-3" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
								<path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
								<path stroke-linecap="round" stroke-linejoin="round" d="M12 21C16.9706 21 21 16.9706 21 12C21 7.02944 16.9706 3 12 3C7.02944 3 3 7.02944 3 12C3 16.9706 7.02944 21 12 21Z" />
							</svg>
							<h4>Sprawdź swoją skrzynkę pocztową</h4>
							<p class="text-muted">
								Wysłaliśmy link do resetowania hasła na adres <strong>{email}</strong>.
							</p>
							<p class="text-muted small">
								Jeśli nie otrzymasz wiadomości w ciągu kilku minut, sprawdź folder spam.
							</p>
							<a href="/login" class="btn btn-link mt-3">Wróć do logowania</a>
						</div>
					{/if}
				</div>
			</div>
		</div>
	</div>
</div>