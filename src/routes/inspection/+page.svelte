<script lang="ts">
	import NewInspectionLocalized from '$lib/components/inspection/localized/NewInspectionLocalized.svelte';
	import SearchVehicle from '$lib/components/SearchVehicle.svelte';
	import VehicleImageAndData from '$lib/components/vehicle/VehicleImageAndData.svelte';
	import IconButton from '$lib/misc/IconButton.svelte';
	import PageTitle from '$lib/misc/PageTitle.svelte';
	import SectionCard from '$lib/misc/SectionCard.svelte';

	let vehicle: Vehicle.Vehicle | undefined = $state();
	let monthly: boolean = $state(false);
</script>

<PageTitle title="Inspekcja pojazdu" subtitle="Wypełnij dane inspekcji">
	{#if monthly}
		<IconButton icon="task-calendar" caption="Zmień na prostą" color="warning" onclick={() => (monthly = false)} />
	{:else}
		<IconButton icon="daily-calendar" caption="Zmień na szczegółową" onclick={() => (monthly = true)} />
	{/if}
</PageTitle>

<SearchVehicle
	onfound={(found) => {
		vehicle = found;
	}}
/>

{#if vehicle}
	<SectionCard title="Dane pojazdu">
		<VehicleImageAndData {vehicle} />
	</SectionCard>

	<NewInspectionLocalized {monthly} {vehicle} />
{/if}
