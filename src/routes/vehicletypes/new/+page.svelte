<script lang="ts">
	import { type SelectEventDetail } from '$lib/misc/Typeahead.svelte';
	import SearchBar from '$lib/misc/SearchBar.svelte';
	/** @type {CarMaker[]} */
	import makersShort from './makers.short.json';
	/** @type {CarMaker[]} */
	import makers from './makers.json';
	/** @type {Record<string, CarnewVehicleType[]>}*/
	import modelsAll from './models.json';
	import CustomFormText from '$lib/form/CustomFormText.svelte';
	import CustomFormSelect from '$lib/form/CustomFormSelect.svelte';
	import licensesRaw from '$lib/assets/data/licenses.json';
	import CustomFormNumeric from '$lib/form/CustomFormNumeric.svelte';
	import CustomFormCheckSwitch from '$lib/form/CustomFormCheckSwitch.svelte';
	import { ECO_FUEL_TYPES } from '$lib/assets/enums';
	import CustomFormTextarea from '$lib/form/CustomFormTextarea.svelte';
	import { cleanVehicleType } from '$lib/assets/cleanItems';
	import CardForm from '$lib/form/CardForm.svelte';
	import { fuelNames } from '$lib/assets/constants';

	const licenses = licensesRaw.categories.reduce(
		(obj, item) => {
			obj[item.code] = `${item.code}: ${item.name}`;
			return obj;
		},
		{} as Record<string, string>
	);

	const allnewVehicleTypes: Record<string, CarModel[]> = modelsAll as any;

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	interface CarMaker {
		id: string;
		name: string;
	}

	interface CarModel {
		id: string;
		name: string;
		type: string;
		fuel: Vehicle.FuelType[];
		image: string;
	}

	let full = $state(false);
	let selected: string = $state('toyota');
	let newVehicleType: Vehicle.Type = $state({ ...cleanVehicleType });
	let fuelTypes: Record<Vehicle.FuelType, string> = $state(fuelNames);
	const newVehicleTypes: Array<CarModel> = $derived(allnewVehicleTypes[selected.toLowerCase()] ?? []);

	const handleSelect = (e: SelectEventDetail<CarModel>) => {
		const isBig = e.original.type === 'van';
		fuelTypes = e.original.fuel.reduce(
			(obj, fuel) => {
				obj[fuel] = fuelNames[fuel];
				return obj;
			},
			{} as Record<Vehicle.FuelType, string>
		);
		newVehicleType = {
			id: '',
			name: e.original.name,
			makeModel: e.original.name,
			taxClass: 'B',
			image: e.original.image,
			fuelType: e.original.fuel[0] as Vehicle.FuelType,
			maxPassengers: isBig ? 6 : 4,
			premium: false,
			eco: ECO_FUEL_TYPES.includes(e.original.fuel[0] as Vehicle.FuelType),
			xl: isBig,
			foodDelivery: false,
			notes: ''
		};
	};

	const onResponse = (response: any) => {
		if (response.id) newVehicleType.id = response.id;
	};

	const handleSelectFuel = (fuelType: string) => {
		newVehicleType!.eco = ECO_FUEL_TYPES.includes(fuelType as Vehicle.FuelType);
	};
</script>

<svelte:head>
	<title>Nowy rodzaj pojazdu</title>
</svelte:head>

<div class="card z-index-5">
	<h5 class="card-header">Dodaj nowy model samochodu</h5>
	<div class="card-body">
		<div class="row">
			<div class="col-12 col-md-6">
				{#if full}
					<SearchBar data={makers} caption="Marka" bind:value={selected} />
				{:else}
					<SearchBar data={makersShort} caption="Marka" bind:value={selected} />
					<button class="btn-clear p-0 text-normalize xsmall text-muted mb-3" onclick={() => (full = true)}>[ Pokaż wszystkich producentów ]</button>
				{/if}
			</div>
			<div class="col-12 col-md-6">
				<SearchBar data={newVehicleTypes} search="name" caption="Model" onselect={handleSelect} />
			</div>
		</div>
	</div>
</div>

<CardForm title="Nowy rodzaj pojazdu" item={newVehicleType} cleanItem={cleanVehicleType} {onResponse}>
	<div class="row">
		<div class="col-12 col-md-6">
			{#if newVehicleType.image.length}
				<div class="flex-center">
					<img src={newVehicleType.image} alt={newVehicleType.makeModel} class="mw-100 mb-3" />
				</div>
			{/if}
			<div class="d-flex flex-column w-100">
				<CustomFormText caption="Nazwa typu" bind:value={newVehicleType.name} />
			</div>
		</div>
		<div class="col-12 col-md-6">
			<div class="d-flex flex-column w-100">
				<div class="mb-3">
					<CustomFormSelect list={fuelTypes} caption="Rodzaj napędu" bind:value={newVehicleType.fuelType} size={6} onchange={handleSelectFuel} class="mb-2" />
					<CustomFormSelect list={licenses} caption="Wymagany rodzaj prawa jazdy" bind:value={newVehicleType.taxClass} size={6} class="mb-2" />
				</div>
				<CustomFormNumeric id="maxPassengers" bind:value={newVehicleType.maxPassengers} size={6} caption="Ilość pasażerów" />
				<CustomFormCheckSwitch bind:checked={newVehicleType.premium} caption="Premium" />
				<CustomFormCheckSwitch bind:checked={newVehicleType.xl} caption="XL / Van" />
				<CustomFormCheckSwitch bind:checked={newVehicleType.eco} caption="Eco / Green" />
			</div>
		</div>
	</div>
	<CustomFormTextarea bind:value={newVehicleType.notes} caption="Notatka" />
</CardForm>
