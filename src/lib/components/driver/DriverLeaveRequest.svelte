<script lang="ts">
	import StatusChangeModal from '$lib/misc/StatusChangeModal.svelte';
	import CustomFormDate from '$lib/form/CustomFormDate.svelte';

	interface Props {
		driver: Driver.Driver;
		onstatuschanged?: (status: Driver.Status) => void;
	}

	let { driver, onstatuschanged }: Props = $props();

	let dateFrom = $state('');
	let dateEnd = $state('');
</script>

<StatusChangeModal
	caption="Dodaj urlop"
	icon="umbrella-beach"
	color="primary"
	headerText="Wniosek o urlop"
	submitText="Zatwierdź urlop"
	noteLabel="Notatka"
	notePlaceholder="Podaj powód urlopu lub dodatkowe informacje..."
	url="/drivers/{driver.id}/status"
	targetStatus="on_leave"
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
