<script lang="ts">
	import ClosableModal from '$lib/misc/ClosableModal.svelte';
	import IconButton from '$lib/misc/IconButton.svelte';
	import CustomFormDate from '$lib/form/CustomFormDate.svelte';
	import { internal, confirmSuccess } from '$lib/nav/internal';

	interface Props {
		driver: Driver.Driver;
		onstatuschanged?: (status: Driver.Status) => void;
	}

	let { driver, onstatuschanged }: Props = $props();

	let isOpen = $state(false);
	let loading = $state(false);

	const formatDate = (date: Date) => {
		const y = date.getFullYear();
		const m = String(date.getMonth() + 1).padStart(2, '0');
		const d = String(date.getDate()).padStart(2, '0');
		return `${y}-${m}-${d}`;
	};

	const today = new Date();
	// eslint-disable-next-line svelte/prefer-svelte-reactivity
	const nextWeek = new Date();
	nextWeek.setDate(nextWeek.getDate() + 7);

	let dateFrom = $state(formatDate(today));
	let dateEnd = $state(formatDate(nextWeek));
	let note = $state('');

	const canSubmit = $derived(dateFrom && dateEnd && note.trim().length > 0);

	const submitSuspend = async () => {
		if (!canSubmit) return;
		loading = true;

		try {
			const response = await confirmSuccess(
				internal.patch(`/drivers/${driver.id}/status`, {
					status: 'suspended',
					dateFrom,
					dateEnd,
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

<IconButton caption="Zawieś tymczasowo" icon="user-forbidden" color="warning" onclick={() => (isOpen = true)} size={6} />

<ClosableModal bind:isOpen size="lg" headerText="Zawieszenie kierowcy">
	<div class="row mb-3">
		<div class="col-md-6">
			<CustomFormDate 
				caption="Data rozpoczęcia" 
				name="dateFrom" 
				bind:value={dateFrom} 
				disabled={loading} 
			/>
		</div>
		<div class="col-md-6">
			<CustomFormDate 
				caption="Data zakończenia" 
				name="dateEnd" 
				bind:value={dateEnd} 
				disabled={loading} 
			/>
		</div>
	</div>

	<div class="mb-3">
		<label for="suspendNote" class="form-label">Powód zawieszenia</label>
		<textarea class="form-control" id="suspendNote" rows="3" bind:value={note} disabled={loading} placeholder="Podaj powód zawieszenia (np. brak badań lekarskich, dochodzenie)..."></textarea>
	</div>

	{#snippet footer()}
		<button class="btn btn-danger mb-0" disabled={!canSubmit || loading} onclick={submitSuspend}>
			{#if loading}
				<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
			{/if}
			Zawieś kierowcę
		</button>
	{/snippet}
</ClosableModal>