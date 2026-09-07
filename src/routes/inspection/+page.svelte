<script lang="ts">
	import NewInspection from '$lib/components/inspection/NewInspection.svelte';
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
		<IconButton icon="daily-calendar" caption="Zmień na szczegółową" color="warning" onclick={() => (monthly = false)} />
	{:else}
		<IconButton icon="task-calendar" caption="Zmień na prostą" onclick={() => (monthly = true)} />
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

	<NewInspection {monthly} />
{/if}
