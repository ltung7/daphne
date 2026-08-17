

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
	import names from '$lib/assets/names.json';
	import { ECO_FUEL_TYPES } from '$lib/assets/enums';
	import CustomFormTextarea from '$lib/form/CustomFormTextarea.svelte';
	import IconButton from '$lib/misc/IconButton.svelte';
	import { confirmSuccess, internal } from '$lib/nav/internal';
	import { wrapLoader } from '$lib/nav/loader';

	const licenses = licensesRaw.categories.reduce(
		(obj, item) => {
			obj[item.code] = `${item.code}: ${item.name}`;
			return obj;
		},
		{} as Record<string, string>
	);

	const fuelNames: Record<Vehicle.FuelType, string> = names.fuel as any;
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
	let newVehicleType: Vehicle.Type = $state({
		id: '',
		fuelType: 'gas',
		image: '',
		makeModel: '',
		name: '',
		spec: { eco: false, foodDelivery: false, maxPassengers: 4, premium: false, xl: false },
		taxClass: 'B',
		notes: ''
	});
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
			spec: {
				maxPassengers: isBig ? 6 : 4,
				premium: false,
				eco: false,
				xl: isBig,
				foodDelivery: false
			},
			notes: ''
		};
	};

	const resetForm = () => {
		newVehicleType = {
			id: '',
			fuelType: 'gas',
			image: '',
			makeModel: '',
			name: '',
			spec: { eco: false, foodDelivery: false, maxPassengers: 4, premium: false, xl: false },
			taxClass: 'B',
			notes: ''
		};
	};

	const saveVehicleType = async (e: Event) => {
		if (e.preventDefault) e.preventDefault();
		const response = await confirmSuccess(wrapLoader(internal.postApi({ type: newVehicleType })));
		if (response.id) newVehicleType.id = response.id;
	};

	const handleSelectFuel = (fuelType: string) => {
		newVehicleType!.spec.eco = ECO_FUEL_TYPES.includes(fuelType as Vehicle.FuelType);
	};
</script>

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

<div class="card mt-3">
	<h5 class="card-header">Nowy rodzaj pojazdu</h5>
	<form class="card-body" onsubmit={saveVehicleType}>
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
					<label for="maxPassengers">Ilość pasażerów</label>
					<CustomFormNumeric id="maxPassengers" bind:value={newVehicleType.spec.maxPassengers} size={6} />
					<CustomFormCheckSwitch bind:checked={newVehicleType.spec.premium} caption="Premium" />
					<CustomFormCheckSwitch bind:checked={newVehicleType.spec.xl} caption="XL / Van" />
					<CustomFormCheckSwitch bind:checked={newVehicleType.spec.eco} caption="Eco / Elektryczny" />
				</div>
			</div>
		</div>
		<CustomFormTextarea bind:value={newVehicleType.notes} caption="Notatka" />
	</form>
	<div class="card-footer">
		<div class="d-flex justify-content-end">
			<IconButton icon="undo" caption="Resetuj" outline onclick={resetForm} color="dark" size={6} />
			<IconButton icon="disk" caption="Zapisz" onclick={saveVehicleType} size={6} class="ms-2 mb-0" />
		</div>
	</div>
</div>