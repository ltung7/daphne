<script lang="ts">
	import StatusChangeModal from '$lib/misc/StatusChangeModal.svelte';

	interface Props {
		vehicle: Vehicle.Vehicle;
		onstatuschanged?: (status: Vehicle.Status) => void;
	}

	let { vehicle, onstatuschanged }: Props = $props();
</script>

<StatusChangeModal
	caption="Wycofaj z floty"
	icon="archive"
	color="secondary"
	headerText="Wycofanie pojazdu z floty"
	submitText="Wycofaj pojazd"
	noteLabel="Powód wycofania"
	notePlaceholder="Podaj powód wycofania (np. koniec leasingu, sprzedaż, szkoda całkowita)..."
	url="/vehicles/{vehicle.registrationNumber}/status"
	targetStatus="retired"
	onsuccess={onstatuschanged}
>
	{#snippet alert()}
		<div class="alert alert-danger mb-0">
			<strong>Uwaga!</strong> Operacja wycofania pojazdu z floty jest trwała. Zmieni ona status pojazdu na <strong>Wycofany</strong> i zablokuje możliwość przypisywania go do kierowców.
		</div>
	{/snippet}
</StatusChangeModal>