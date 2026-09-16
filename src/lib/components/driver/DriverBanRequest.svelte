<script lang="ts">
	import ClosableModal from '$lib/misc/ClosableModal.svelte';
	import IconButton from '$lib/misc/IconButton.svelte';
	import UIcon from '$lib/misc/UIcon.svelte';
	import { internal, confirmSuccess } from '$lib/nav/internal';

	interface Props {
		driver: Driver.Driver;
		onstatuschanged?: (status: Driver.Status) => void;
	}

	let { driver, onstatuschanged }: Props = $props();

	let isOpen = $state(false);
	let loading = $state(false);
	let note = $state('');

	const canSubmit = $derived(note.trim().length > 0);

	const submitBan = async () => {
		if (!canSubmit) return;
		loading = true;

		try {
			const response = await confirmSuccess(
				internal.patch(`/drivers/${driver.id}/status`, {
					status: 'banned',
					note
				})
			);

			if (response.status) {
				driver.status = response.status;
				onstatuschanged?.(response.status);
				isOpen = false;
			}
		} finally {
			loading = false;
		}
	};
</script>

<div class="flex-center">
	<IconButton caption="Zablokuj" icon="user-forbidden" color="danger" onclick={() => (isOpen = true)} size={6} />
</div>

<ClosableModal bind:isOpen size="lg" headerText="Zablokowanie kierowcy">
	<div class="alert alert-danger mb-3 small text-white fw-bold">
		<div class="d-flex">
			<UIcon name="exclamation" size={2} />
			<div class="w-100 ms-3">
				<strong>Uwaga!</strong> Zablokowanie kierowcy to poważna akcja. Konto zostanie permanentnie zablokowane i kierowca straci dostęp do platformy.
			</div>
		</div>
	</div>

	<div class="mb-3">
		<label for="banNote" class="form-label">Powód blokady</label>
		<textarea class="form-control" id="banNote" rows="3" bind:value={note} disabled={loading} placeholder="Podaj powód blokady..."></textarea>
	</div>

	{#snippet footer()}
		<button class="btn btn-danger mb-0" disabled={!canSubmit || loading} onclick={submitBan}>
			{#if loading}
				<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
			{/if}
			Zablokuj kierowcę
		</button>
	{/snippet}
</ClosableModal>
