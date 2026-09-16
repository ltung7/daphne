<script lang="ts">
	import StatusChangeModal from '$lib/misc/StatusChangeModal.svelte';
	import CustomFormDate from '$lib/form/CustomFormDate.svelte';

	interface Props {
		driver: Driver.Driver;
		onstatuschanged?: (status: Driver.Status) => void;
	}

	let { driver, onstatuschanged }: Props = $props();

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
</script>

<StatusChangeModal
	caption="Zawieś tymczasowo"
	icon="user-forbidden"
	color="warning"
	headerText="Zawieszenie kierowcy"
	submitText="Zawieś kierowcę"
	noteLabel="Powód zawieszenia"
	notePlaceholder="Podaj powód zawieszenia (np. brak badań lekarskich, dochodzenie)..."
	url="/drivers/{driver.id}/status"
	targetStatus="suspended"
	extraPayload={{ dateFrom, dateEnd }}
	canSubmitExtra={Boolean(dateFrom && dateEnd)}
	onsuccess={onstatuschanged}
>
	<div class="row">
		<div class="col-md-6">
			<CustomFormDate 
				caption="Data rozpoczęcia" 
				name="dateFrom" 
				bind:value={dateFrom} 
			/>
		</div>
		<div class="col-md-6">
			<CustomFormDate 
				caption="Data zakończenia" 
				name="dateEnd" 
				bind:value={dateEnd} 
			/>
		</div>
	</div>
</StatusChangeModal>