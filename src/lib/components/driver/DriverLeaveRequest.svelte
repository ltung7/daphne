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

	let dateFrom = $state('');
	let dateEnd = $state('');
	let note = $state('');

	const canSubmit = $derived(dateFrom && dateEnd && note.trim().length > 0);

	const submitLeave = async () => {
		if (!canSubmit) return;
		loading = true;

		try {
			const response = await confirmSuccess(
				internal.patch(`/drivers/${driver.id}/status`, {
					status: 'on_leave',
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

<IconButton caption="Dodaj urlop" icon="umbrella-beach" onclick={() => (isOpen = true)} size={6} />

<ClosableModal bind:isOpen size="lg" headerText="Wniosek o urlop">
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
		<label for="leaveNote" class="form-label">Notatka</label>
		<textarea class="form-control" id="leaveNote" rows="3" bind:value={note} disabled={loading} placeholder="Podaj powód urlopu lub dodatkowe informacje..."></textarea>
	</div>

	{#snippet footer()}
		<button class="btn btn-warning mb-0" disabled={!canSubmit || loading} onclick={submitLeave}>
			{#if loading}
				<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
			{/if}
			Zatwierdź urlop
		</button>
	{/snippet}
</ClosableModal>
