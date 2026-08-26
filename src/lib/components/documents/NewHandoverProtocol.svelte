<script lang="ts">
	import { goto } from '$app/navigation';
	import { cleanHandoverProtocol } from '$lib/assets/cleanItems';
	import { handoverDocumentSchema } from '$lib/assets/zodschemas/handover.zod';
	import CardForm from '$lib/form/CardForm.svelte';
	import IconButton from '$lib/misc/IconButton.svelte';
	import SearchBar from '$lib/misc/SearchBar.svelte';
	import type { SelectEventDetail } from '$lib/misc/Typeahead.svelte';
	import { fetchDrivers, fetchVehicles } from '$lib/nav/fetchData';
	import { internal } from '$lib/nav/internal';
	import { endLoad, startLoad } from '$lib/nav/loader';
	import { onMount } from 'svelte';
	import HandoverProtocolFields from './HandoverProtocolFields.svelte';
	import { addToast } from '$lib/toast';
	import { downloadFileBlob } from '$lib/utils/downloadDataLink';

	interface Props {
		vehicle?: Vehicle.Vehicle;
		driver?: Driver.Driver;
	}

	interface Manager {
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

	const sendAction = async (action: 'pdf' | 'docusign' | 'close' | 'save') => {
		startLoad();
		if (action === 'pdf') {
			const response = await internal.post('/handovers/new/api', { id, action: 'save', handover: handoverProtocol });
			if (response.id) id = response.id;

			const pdfBlob: Blob = await internal.post('/handovers/new/api', { id, action, handover: handoverProtocol }, { responseType: 'blob' });
			if (pdfBlob.type === 'application/json') {
				endLoad();
				return addToast('Nie udało się wygenerować wydruku');
			}
			downloadFileBlob(pdfBlob, `Protokół wydania pojazdu ${handoverProtocol.registrationNumber} ${handoverProtocol.driverName}`, pdfBlob.type);
			endLoad();

			if (id) {
				setTimeout(() => {
					goto(`/handovers/${response.id}`);
				}, 500);
			}
		} else {
			const response = await internal.post('/handovers/new/api', { id, action, handover: handoverProtocol });
			endLoad();
			if (response.id) goto(`/handovers/${response.id}`);
		}
	};

	function hasOnlyAllowedErrors<T extends object>(errors: Partial<Record<keyof T, string | undefined>>, allowedKeys: (keyof T)[]): boolean {
		const allowedSet = new Set<string>(allowedKeys as string[]);

		return Object.entries(errors).every(([ key, value ]) => {
			if (!value) return true;
			return allowedSet.has(key);
		});
	}

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

		managers = [
			{ name: 'Janusz Brzęczyszczykiewicz', email: 'admin@macropart.com' },
			{ name: 'Grażyna Chrząszcz', email: 'veleanor@finnergroup.com' }
		];

		handoverProtocol.managerName = managers[0].name;
		handoverProtocol.managerEmail = managers[0].email;
	});
</script>

<svelte:head>
	<title>Wygeneruj protokół wydania pojazdu</title>
</svelte:head>

<CardForm title="Wygeneruj protokół wydania pojazdu" item={handoverProtocol} cleanItem={cleanHandoverProtocol} name="handover" schema={handoverDocumentSchema}>
	{#snippet children({ errors, touch })}
		<section class="pb-3 mb-3 border-bottom">
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
			{#if managers.length}
				<SearchBar data={managers} caption="Wybierz menadżera floty" search="name" onselect={(e) => updateManager(e)} />
			{/if}
		</section>
		<HandoverProtocolFields bind:handoverProtocol {touch} {errors} />
	{/snippet}
	{#snippet submitSnippet({ isValid, errors })}
		{@const halfValid = hasOnlyAllowedErrors<DocumentGenerator.HandoverDocument>(errors, [ 'managerName', 'managerEmail' ])}
		<IconButton icon="cross" caption="Wydaj bez dokumentu" color="dark" size={6} class="ms-2 mb-0" disabled={!halfValid} onclick={() => sendAction('close')} />
		<IconButton icon="print" caption="Pobierz PDF" color="primary" size={6} class="ms-2 mb-0" disabled={!halfValid} onclick={() => sendAction('pdf')} />
		<IconButton icon="digital-signature" caption="Wyślij DocuSign" color="success" size={6} class="ms-2 mb-0" disabled={!isValid} onclick={() => sendAction('docusign')} />
	{/snippet}
</CardForm>
