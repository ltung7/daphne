<script lang="ts">
	import StatusChangeModal from '$lib/misc/StatusChangeModal.svelte';

	interface Props {
		vehicle: Vehicle.Vehicle;
		onstatuschanged?: (status: Vehicle.Status) => void;
	}

	let { vehicle, onstatuschanged }: Props = $props();
</script>

<StatusChangeModal
	caption="Zgłoś awarię"
	icon="triangle-warning"
	color="danger"
	headerText="Zgłoszenie awarii pojazdu"
	submitText="Zgłoś awarię"
	noteLabel="Opis awarii"
	notePlaceholder="Opisz usterkę (np. uszkodzone zawieszenie, nie odpala, stłuczka)..."
	url="/vehicles/{vehicle.registrationNumber}/status"
	targetStatus="broken"
	onsuccess={onstatuschanged}
/>