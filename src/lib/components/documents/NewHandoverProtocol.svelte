<script lang="ts">
	import { cleanHandoverProtocol } from '$lib/assets/cleanItems';
	import SearchBar from '$lib/misc/SearchBar.svelte';
	import type { SelectEventDetail } from '$lib/misc/Typeahead.svelte';
	import { fetchDrivers, fetchVehicles, fetchHandoverSigners } from '$lib/nav/fetchData';
	import { onMount } from 'svelte';
	import AssignmentHandoverProtocolForm from './AssignmentHandoverProtocolForm.svelte';

	interface Props {
		vehicle?: Vehicle.Vehicle;
		driver?: Driver.Driver;
	}

	interface Manager {
		id: string;
		name: string;
		email: string;
	}

	let { vehicle, driver }: Props = $props();
	let vehicles: Vehicle.Vehicle[] = $state([]);
	let drivers: Driver.Driver[] = $state([]);
	let managers: Manager[] = $state([]);
	let handoverProtocol: DocumentGenerator.HandoverDocument = $state({ ...cleanHandoverProtocol });
	let id: string | undefined = $state();

	const updateVehicle = (event: SelectEventDetail<Vehicle.Vehicle>) => {
		const vehicleData = event.original;
		handoverProtocol.registrationNumber = vehicleData.registrationNumber;
		handoverProtocol.vin = vehicleData.vin;
		handoverProtocol.model = vehicleData.modelMake;
	};

	const updateDriver = (event: SelectEventDetail<Driver.Driver>) => {
		setDriverData(event.original);
	};

	const updateManager = (event: SelectEventDetail<Manager>) => {
		handoverProtocol.managerId = event.original.id;
		handoverProtocol.managerName = event.original.name;
		handoverProtocol.managerEmail = event.original.email;
	};

	const setDriverData = (driverData: Driver.Driver) => {
		handoverProtocol.driverId = driverData.id;
		handoverProtocol.driverName = driverData.name;
		handoverProtocol.identificationDocumentType = driverData.identificationDocumentType;
		handoverProtocol.identificationDocumentNumber = driverData.identificationDocumentNumber;
		handoverProtocol.driverEmail = driverData.email;
		if (driverData.polishLanguage === 'basic') {
			const locales = [ 'pl', 'en', 'uk', 'be', 'ne', 'cs' ];
			const foundLocale = locales.find((locale) => driverData.additionalLanguages[locale]);
			if (foundLocale) handoverProtocol.locale = foundLocale as DocumentGenerator.Locale;
			else handoverProtocol.locale = 'en';
		} else {
			handoverProtocol.locale = 'pl';
		}
	};

	onMount(async () => {
		await Promise.all([
			!vehicle && fetchVehicles({ status: 'available' }, [ 'status', 'registrationNumber', 'modelMake', 'vin', 'fuelCardId' ]).then((list) => (vehicles = list)),
			!driver && fetchDrivers({ status: 'available' }, [ 'status', 'email', 'name', 'polishLanguage', 'additionalLanguages', 'identificationDocumentNumber', 'identificationDocumentType' ]).then((list) => (drivers = list)),
			fetchHandoverSigners([ 'id', 'name', 'email' ]).then((list) => (managers = list))
		]);

		if (vehicle) {
			handoverProtocol.registrationNumber = vehicle.registrationNumber;
			handoverProtocol.vin = vehicle.vin;
			handoverProtocol.model = vehicle.modelMake;
		}

		if (driver) {
			setDriverData(driver);
		}
	});
</script>

<AssignmentHandoverProtocolForm bind:handoverProtocol bind:id postUrl="/handovers/new/api">
	{#snippet header()}
		<section class="pb-3 mb-3 border-bottom">
			{#if !vehicle}
				{#if vehicles.length}
					<SearchBar data={vehicles} caption="Wybierz pojazd" search="registrationNumber" onselect={(e) => updateVehicle(e)} />
				{:else}
					<p class="text-muted">Brak dostępnych pojazdów</p>
				{/if}
			{/if}
			{#if !driver}
				{#if drivers.length}
					<SearchBar data={drivers} caption="Wybierz kierowcę" search="name" onselect={(e) => updateDriver(e)} />
				{:else}
					<p class="text-muted">Brak dostępnych kierowców</p>
				{/if}
			{/if}
			{#if managers.length}
				<SearchBar data={managers} caption="Wybierz menadżera floty" search="name" onselect={(e) => updateManager(e)} />
			{:else}
				<p class="text-muted">Brak dostępnych menedżerów</p>
			{/if}
		</section>
	{/snippet}
</AssignmentHandoverProtocolForm>
