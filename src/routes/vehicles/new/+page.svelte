<script lang="ts">
	/* eslint-disable svelte/prefer-svelte-reactivity */
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { cleanVehicle } from '$lib/assets/cleanItems';
	import CardForm from '$lib/form/CardForm.svelte';
	import CustomFormDate from '$lib/form/CustomFormDate.svelte';
	import CustomFormNumeric from '$lib/form/CustomFormNumeric.svelte';
	import CustomFormSelect from '$lib/form/CustomFormSelect.svelte';
	import CustomFormText from '$lib/form/CustomFormText.svelte';
	import CustomFormTextarea from '$lib/form/CustomFormTextarea.svelte';
	import { fetchVehicleTypes } from '$lib/nav/fetchData';
	import randomNumber from '$lib/utils/randomNumber';
	import randomString from '$lib/utils/randomString';
	import { onMount } from 'svelte';

	let typeSelect: Record<string, string> = $state({});
	let vehicle: Vehicle.NewVehicleData = $state({ ...cleanVehicle });

	const handleTypeChange = (typeId: string) => {
		vehicle.name = typeSelect[typeId];
		vehicle.modelMake = typeSelect[typeId];
	};

	const onResponse = (response: any) => {
		if (response.id) goto('/vehicles/' + response.id);
	}

	const testData = () => {
		function randomDateString (min: number, max: number) {
			const number = randomNumber(min, max);
			const dt = new Date()
			dt.setDate(number)
			return dt.toISOString().substring(0, 10);
		}

		vehicle = {
			...vehicle, 
			mileage: randomNumber(100, 50000),
			firstRegistrationDate: randomDateString(-100, -300),
			insuranceExpiration: randomDateString(20, 150),
			technicalExpiration: randomDateString(20, 150),
			registrationNumber: [ randomString(2), randomNumber(100, 999), randomString(2) ].join('').toUpperCase(),
			vin: randomString(17).toUpperCase(),
			notes: `Test ${randomNumber(10000, 99999)}`
		}
	}

	onMount(async () => {
		const types = await fetchVehicleTypes([ 'id', 'name' ]);
		typeSelect = types.reduce(
			(obj, item) => {
				obj[item.id] = item.name;
				return obj;
			},
			{} as Record<string, string>
		);

		const typeParam = $page.url.searchParams.get('type');
		if (typeParam && typeSelect[typeParam]) {
			vehicle.typeId = typeParam;
		} else {
			vehicle.typeId = types[0].id;
		}
		handleTypeChange(vehicle.typeId)
	});
</script>

<CardForm title="Nowy pojazdu" item={vehicle} cleanItem={cleanVehicle} {onResponse} {testData}>
	<CustomFormSelect bind:value={vehicle.typeId} caption="Rodzaj pojazdu" list={typeSelect} size={6} onchange={handleTypeChange} />
	<div class="row mt-3">
		<div class="col-12 col-md-6">
			<CustomFormText name="vehicleRegistrationNumber" caption="Numer rejestracyjny" bind:value={vehicle.registrationNumber} />
			<CustomFormText name="vehicleVin" caption="Numer VIN" bind:value={vehicle.vin} />
			<CustomFormNumeric bind:value={vehicle.mileage} caption="Przebieg" size={6} />
		</div>
		<div class="col-12 col-md-6">
			<CustomFormDate name="firstRegistrationDate" id="firstRegistrationDate" caption="Data pierwszej rejestracji" bind:value={vehicle.firstRegistrationDate} setMaxDate />
			<CustomFormDate name="insuranceExpiration" id="insuranceExpiration" caption="Termin ważności ubezpieczenia" bind:value={vehicle.insuranceExpiration} />
			<CustomFormDate name="technicalExpiration" id="technicalExpiration" caption="Termin ważności badania" bind:value={vehicle.technicalExpiration} />
		</div>
	</div>
	<CustomFormTextarea bind:value={vehicle.notes} caption="Notatka" />
</CardForm>
