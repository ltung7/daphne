<script lang="ts">
	import StatusChangeModal from '$lib/misc/StatusChangeModal.svelte';
	import CustomFormDate from '$lib/form/CustomFormDate.svelte';

	interface Props {
		vehicle: Vehicle.Vehicle;
		onstatuschanged?: (status: Vehicle.Status) => void;
	}

	let { vehicle, onstatuschanged }: Props = $props();

	const formatDate = (date: Date) => {
		const y = date.getFullYear();
		const m = String(date.getMonth() + 1).padStart(2, '0');
		const d = String(date.getDate()).padStart(2, '0');
		return `${y}-${m}-${d}`;
	};

	// eslint-disable-next-line svelte/prefer-svelte-reactivity
	const nextWeek = new Date();
	nextWeek.setDate(nextWeek.getDate() + 7);

	let expectedEndDate = $state(formatDate(nextWeek));
</script>

<StatusChangeModal
	caption="Wyślij do serwisu"
	icon="wrench-simple"
	color="warning"
	headerText="Zgłoszenie do serwisu"
	submitText="Zgłoś do serwisu"
	noteLabel="Powód serwisu"
	notePlaceholder="Podaj powód wysłania do serwisu (np. przegląd, wymiana oleju, naprawa usterki)..."
	url="/vehicles/{vehicle.registrationNumber}/status"
	targetStatus="under_maintenance"
	extraPayload={{ expectedEndDate }}
	canSubmitExtra={expectedEndDate.length > 0}
	onsuccess={onstatuschanged}
>
	<div class="row">
		<div class="col-md-12">
			<CustomFormDate 
				caption="Przewidywana data odbioru" 
				name="expectedEndDate" 
				bind:value={expectedEndDate} 
			/>
		</div>
	</div>
</StatusChangeModal>