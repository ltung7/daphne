<script lang="ts">
	import { cleanHandoverProtocol } from '$lib/assets/cleanItems';
	import { handoverEquipmentList as equipmentList } from '$lib/assets/constants';
	import { onMount } from 'svelte';
	import ReturnHandoverProtocolForm from './ReturnHandoverProtocolForm.svelte';

	interface Props {
		vehicle: Vehicle.Vehicle;
		driver: Driver.Driver;
		initialHandover: DocumentGenerator.HandoverDocumentRecord;
		unilateral?: boolean;
	}

	let {
		vehicle,
		driver,
		initialHandover,
		unilateral = false
	}: Props = $props();

	let handoverProtocol: DocumentGenerator.HandoverDocumentRecord = $state({
		...cleanHandoverProtocol,
		type: 'return'
	} as DocumentGenerator.HandoverDocumentRecord);
	let id: string | undefined = $state();

	const postUrl = $derived(unilateral ? `/handovers/${initialHandover.id}/unilateral/api` : `/handovers/${initialHandover.id}/return/api`);
	const docTitle = $derived(unilateral ? 'Protokół jednostronnego odbioru pojazdu' : 'Protokół zwrotu pojazdu');

	const setDriverData = (driverData: Driver.Driver) => {
		handoverProtocol.driverId = driverData.id;
		handoverProtocol.driverName = driverData.name;
		handoverProtocol.identificationDocumentType = driverData.identificationDocumentType;
		handoverProtocol.identificationDocumentNumber = driverData.identificationDocumentNumber;
		handoverProtocol.driverEmail = driverData.email;
		if (initialHandover?.locale) {
			handoverProtocol.locale = initialHandover.locale;
		} else if (driverData.polishLanguage === 'basic') {
			const locales = [ 'pl', 'en', 'uk', 'be', 'ne', 'cs' ];
			const foundLocale = locales.find((locale) => driverData.additionalLanguages?.[locale]);
			if (foundLocale) handoverProtocol.locale = foundLocale as DocumentGenerator.Locale;
			else handoverProtocol.locale = 'en';
		} else {
			handoverProtocol.locale = 'pl';
		}
	};

	onMount(() => {
		handoverProtocol.type = unilateral ? 'unilateral' : 'return';

		if (initialHandover) {
			handoverProtocol.registrationNumber = initialHandover.registrationNumber;
			handoverProtocol.vin = initialHandover.vin;
			handoverProtocol.model = initialHandover.model;
			handoverProtocol.driverId = initialHandover.driverId;
			handoverProtocol.driverName = initialHandover.driverName;
			handoverProtocol.driverEmail = initialHandover.driverEmail;
			handoverProtocol.identificationDocumentType = initialHandover.identificationDocumentType;
			handoverProtocol.identificationDocumentNumber = initialHandover.identificationDocumentNumber;
			handoverProtocol.managerName = initialHandover.managerName;
			handoverProtocol.managerEmail = initialHandover.managerEmail;
			handoverProtocol.place = initialHandover.place;
			handoverProtocol.isElectric = initialHandover.isElectric;
			if (initialHandover.locale) handoverProtocol.locale = initialHandover.locale;

			for (const item of equipmentList) {
				handoverProtocol[item.key] = initialHandover[item.key];
			}
		}

		if (vehicle) {
			handoverProtocol.registrationNumber = vehicle.registrationNumber;
			handoverProtocol.vin = vehicle.vin;
			handoverProtocol.model = vehicle.modelMake;
			if (vehicle.mileage) handoverProtocol.milage = vehicle.mileage.toString();
		}

		if (driver) {
			setDriverData(driver);
		}
	});
</script>

<ReturnHandoverProtocolForm
	bind:handoverProtocol
	{cleanHandoverProtocol}
	{postUrl}
	{unilateral}
	requiredEquipment={initialHandover}
	{docTitle}
	bind:id
/>