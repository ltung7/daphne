<script lang="ts">
	import SearchVehicle from '$lib/components/SearchVehicle.svelte';
	import NewInspection from '$lib/components/inspection/NewInspection.svelte';
	import VehicleImageAndData from '$lib/components/vehicle/VehicleImageAndData.svelte';
	import PageTitle from '$lib/misc/PageTitle.svelte';
	import SectionCard from '$lib/misc/SectionCard.svelte';

	let vehicle: Vehicle.Vehicle | undefined = $state();
	let monthly: boolean = $state(false);
</script>

<PageTitle title="Nowa inspekcja" subtitle="Wybierz pojazd i wypełnij inspekcję" back="/inspections" />

<SearchVehicle
	onfound={(found) => {
		vehicle = found;
	}}
/>

{#if vehicle}
	<SectionCard title="Dane pojazdu">
		<VehicleImageAndData {vehicle} />
	</SectionCard>

	<NewInspection {monthly} {vehicle} />
{/if}