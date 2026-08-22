<script lang="ts">
	import { cleanHandoverProtocol } from '$lib/assets/cleanItems';
	import { identificationDocumentNames } from '$lib/assets/constants';
	import CardForm from '$lib/form/CardForm.svelte';
	import CustomFormCheckSwitch from '$lib/form/CustomFormCheckSwitch.svelte';
	import CustomFormDate from '$lib/form/CustomFormDate.svelte';
	import CustomFormText from '$lib/form/CustomFormText.svelte';
	import CustomFormTextarea from '$lib/form/CustomFormTextarea.svelte';
	import Flag from '$lib/misc/Flag.svelte';
	import SearchBar from '$lib/misc/SearchBar.svelte';
	import type { SelectEventDetail } from '$lib/misc/Typeahead.svelte';
	import { fetchDrivers, fetchVehicles } from '$lib/nav/fetchData';
	import { onMount } from 'svelte';

	interface Props {
		vehicle?: Vehicle.Vehicle;
		driver?: Driver.Driver;
	}

	let { vehicle, driver }: Props = $props();

	let vehicles: Vehicle.Vehicle[] = $state([]);
	let drivers: Driver.Driver[] = $state([]);

	let handoverProtocol: DocumentGenerator.HandoverDocument = $state({ ...cleanHandoverProtocol });

	const updateVehicle = (event: SelectEventDetail<Vehicle.Vehicle>) => {
		const vehicleData = event.original;
		handoverProtocol.registrationNumber = vehicleData.registrationNumber;
		handoverProtocol.vin = vehicleData.vin;
		handoverProtocol.model = vehicleData.modelMake;
	};

	const updateDriver = (event: SelectEventDetail<Driver.Driver>) => {
		setDriverData(event.original);
	};

	const setDriverData = (driverData: Driver.Driver) => {
		handoverProtocol.driverName = driverData.name;
		handoverProtocol.driverIdentification = identificationDocumentNames[driverData.identificationDocumentType] + ' ' + driverData.identificationDocumentNumber;
		handoverProtocol.driverEmail = driverData.email;
		if (driverData.polishLanguage === 'basic') {
			const locales: DocumentGenerator.AllLocalesTuple = [ 'pl', 'en', 'uk', 'be', 'ne' ];
			const foundLocale = locales.find((locale) => driverData.additionalLanguages[locale]);
			if (foundLocale) handoverProtocol.locale = foundLocale;
			else handoverProtocol.locale = 'en';
		} else {
			handoverProtocol.locale = 'pl';
		}
	};

	onMount(async () => {
		await Promise.all([
			// !vehicle && fetchVehicles({ status: 'available' }).then(list => vehicles = list),
			// !driver && fetchDrivers({ status: 'inactive' }).then(list => drivers = list)
			!vehicle && fetchVehicles({}, [ 'registrationNumber', 'modelMake', 'vin', 'fuelCardId' ]).then((list) => (vehicles = list)),
			!driver && fetchDrivers({}, [ 'email', 'name', 'polishLanguage', 'additionalLanguages', 'identificationDocumentNumber', 'identificationDocumentType' ]).then((list) => (drivers = list))
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

<svelte:head>
	<title>Wygeneruj protokół wydania pojazdu</title>
</svelte:head>

<CardForm title="Wygeneruj protokół wydania pojazdu" item={handoverProtocol} cleanItem={cleanHandoverProtocol}>
	{#if vehicle}
		<h4>Pojazd <strong>{vehicle.registrationNumber}</strong></h4>
	{/if}
	{#if driver}
		<h4>Kierowca <strong>{driver.name}</strong></h4>
	{/if}
	{#if vehicles.length}
		<SearchBar data={vehicles} caption="Wybierz pojazd" search="registrationNumber" onselect={(e) => updateVehicle(e)} />
	{/if}
	{#if drivers.length}
		<SearchBar data={drivers} caption="Wybierz kierowcę" search="name" onselect={(e) => updateDriver(e)} />
	{/if}
	<hr />
	<div class="row">
		<div class="col-12 border-top pt-3">
			<h5>1. Data i strony umowy</h5>
		</div>
		<div class="col-12 col-md-6">
			<Flag country={handoverProtocol.locale} size={4} />
		</div>
		<div class="col-12 col-md-6">
			<CustomFormText caption="Miejsce" bind:value={handoverProtocol.place} />
		</div>
		<div class="col-12 col-md-6">
			<CustomFormDate caption="Data" bind:value={handoverProtocol.date} />
		</div>
		<div class="col-12 col-md-6">
			<CustomFormText caption="Właściciel" bind:value={handoverProtocol.owner} readonly />
		</div>
		<div class="col-12 col-md-6">
			<CustomFormText caption="Imię i nazwisko menadżera" bind:value={handoverProtocol.managerName} readonly />
		</div>
		<div class="col-12 col-md-6">
			<CustomFormText caption="Imię i nazwisko kierowcy" bind:value={handoverProtocol.driverName} readonly />
		</div>
		<div class="col-12 col-md-6">
			<CustomFormText caption="Numer paszportu/legitymacji" bind:value={handoverProtocol.driverIdentification} readonly />
		</div>
		<div class="col-12 border-top pt-3">
			<h5>2. Pojazd i stan licznika</h5>
		</div>
		<div class="col-12">
			<CustomFormText caption="Model pojazdu" bind:value={handoverProtocol.model} readonly />
		</div>
		<div class="col-12 col-md-6">
			<CustomFormText caption="Numer rejestracyjny" bind:value={handoverProtocol.registrationNumber} readonly />
		</div>
		<div class="col-12 col-md-6">
			<CustomFormText caption="VIN" bind:value={handoverProtocol.vin} readonly />
		</div>
		<div class="col-12 col-md-6">
			<CustomFormText caption="Przebieg [km]" bind:value={handoverProtocol.milage} />
		</div>

		<div class="col-12 col-md-6">
			<CustomFormText caption="Poziom paliwa lub baterii (%)" bind:value={handoverProtocol.remaining} />
		</div>
		<div class="col-12 border-top pt-3">
			<h5>3. Wyposażenie i dokumenty flotowe</h5>
		</div>
		<div class="col-12 col-md-6 mb-3">
			<CustomFormCheckSwitch caption="Klucz" bind:checked={handoverProtocol.key} />
			<CustomFormCheckSwitch caption="Klucz zapasowy" bind:checked={handoverProtocol.spareKey} />
			<CustomFormCheckSwitch caption="Dowód rejestracyjny" bind:checked={handoverProtocol.registration} />
			<CustomFormCheckSwitch caption="Lampa dachowa TAXI" bind:checked={handoverProtocol.roofSign} />
			<CustomFormCheckSwitch caption="Karta paliwowa" bind:checked={handoverProtocol.fuelCard} />
			<CustomFormCheckSwitch caption="Karta myjni" bind:checked={handoverProtocol.carWashCard} />
			<CustomFormCheckSwitch caption="Koło zapasowe i zestaw naprawczy" bind:checked={handoverProtocol.tire} />
		</div>
		<div class="col-12 col-md-6 mb-3">
			<CustomFormCheckSwitch caption="Gaśnica" bind:checked={handoverProtocol.exinguisher} />
			<CustomFormCheckSwitch caption="Trójkąt" bind:checked={handoverProtocol.triangle} />
			<CustomFormCheckSwitch caption="Kamizelka odblaskowa" bind:checked={handoverProtocol.vest} />
			<CustomFormCheckSwitch caption="Apteczka" bind:checked={handoverProtocol.firstAidKit} />
			<CustomFormCheckSwitch caption="Wydaniki" bind:checked={handoverProtocol.mats} />
			<CustomFormCheckSwitch caption="Uchwyt na telefon" bind:checked={handoverProtocol.phoneHolder} />
			<CustomFormCheckSwitch caption="Ładowarka telefonu" bind:checked={handoverProtocol.phoneCharger} />
		</div>
		<div class="col-12 border-top pt-3">
			<h5>4. STAN WIZUALNY, TECHNICZNY I UWAGI</h5>
		</div>
		<div class="col-12">
			<CustomFormTextarea bind:value={handoverProtocol.visual} size={4} />
		</div>
		<div class="col-12 border-top pt-3">
			<h5>5. Potwierdź adres email</h5>
		</div>
		<div class="col-12 col-md-6">
			<CustomFormText caption="Adres e‑mail kierownika" bind:value={handoverProtocol.managerEmail} />
		</div>
		<div class="col-12 col-md-6">
			<CustomFormText caption="Adres e‑mail kierowcy" bind:value={handoverProtocol.driverEmail} />
		</div>
	</div>
</CardForm>
