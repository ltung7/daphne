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
	import IconLink from '$lib/misc/IconLink.svelte';
	import PageTitle from '$lib/misc/PageTitle.svelte';
	import { TabContent, TabPane } from '@sveltestrap/sveltestrap';
	import IconButton from '$lib/misc/IconButton.svelte';
	import { wrapLoader } from '$lib/nav/loader';
	import { internal } from '$lib/nav/internal';
	import ImageFallback from '$lib/misc/ImageFallback.svelte';

	const licenses = licensesRaw.categories.reduce(
		(obj, item) => {
			obj[item.code] = `${item.code}: ${item.name}`;
			return obj;
		},
		{} as Record<string, string>
	);

	const transmissionTypes: Record<Vehicle.TransmissionType, string> = {
		manual: 'Manualna',
		automatic: 'Automatyczna',
		cvt: 'CVT',
		'semi-automatic': 'Półautomatyczna',
		'dual-clutch': 'Dwusprzęgłowa'
	};

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
	let query: string = $state('toyota corolla 2023 plugin in');
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
			requiredDrivingLicense: 'B',
			image: e.original.image,
			fuelType: e.original.fuel[0] as Vehicle.FuelType,
			transmission: 'manual',
			seats: isBig ? 7 : 5,
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

	const fillWithAi = async () => {
		const response = await wrapLoader(internal.getApi({ query }))
		if (response.data) Object.assign(newVehicleType, response.data)
	}
</script>

<PageTitle title="Nowy rodzaj pojazdu" subtitle="Dodaj nowy typ pojazdu do systemu">
	<IconLink icon="left" caption="Powrót do listy" href="/vehicletypes" />
</PageTitle>

<TabContent class="card">
	<TabPane class="card-body" tabId="ai" tab="Generuj AI" active>
		<div class="d-flex gap-3">
			<CustomFormText bind:value={query} caption="Zapytanie" class="w-100" />
			<div style="min-width: 160px; margin-top: 1.6rem;">
			<IconButton icon="artificial-intelligence" caption="Uzupełnij z AI" onclick={fillWithAi} size={5} />
			</div>
		</div>
	</TabPane>
	<TabPane class="card-body" tabId="search" tab="Wyszukaj model">
		<div class="row">
			<div class="col-12 col-md-6">
				{#if full}
					<SearchBar data={makers} caption="Marka" bind:value={selected} />
				{:else}
					<SearchBar data={makersShort} caption="Marka" bind:value={selected} />
					<button class="btn-clear p-0 text-normalize xsmall text-muted mb-0" onclick={() => (full = true)}>[ Pokaż wszystkich producentów ]</button>
				{/if}
			</div>
			<div class="col-12 col-md-6">
				<SearchBar data={newVehicleTypes} search="name" caption="Model" onselect={handleSelect} />
			</div>
		</div>
	</TabPane>
	<TabPane class="card-body" tabId="text" tab="Wpisz ręcznie">
		<CustomFormText caption="Marka i model" bind:value={newVehicleType.makeModel} />
		<div class="text-muted">Tutaj wpisz tylko ogólną markę i model pojazdu</div>
	</TabPane>
</TabContent>

<CardForm item={newVehicleType} cleanItem={cleanVehicleType} {onResponse}>
	<div class="row">
		<div class="col-12 col-md-6">
			{#if newVehicleType.image.length}
				<div class="flex-center">
					<ImageFallback src={newVehicleType.image} alt={newVehicleType.makeModel} class="mw-100 mb-3" />
				</div>
			{/if}
			<div class="d-flex flex-column w-100">
				<CustomFormText caption="Nazwa wewnętrzna" bind:value={newVehicleType.name} />
				<CustomFormSelect list={fuelTypes} caption="Rodzaj napędu" bind:value={newVehicleType.fuelType} size={6} onchange={handleSelectFuel} class="mb-2" />
				<CustomFormSelect list={licenses} caption="Wymagany rodzaj prawa jazdy" bind:value={newVehicleType.requiredDrivingLicense} size={6} class="mb-2" />
				<CustomFormSelect list={transmissionTypes} caption="Skrzynia biegów" bind:value={newVehicleType.transmission} size={6} class="mb-2" />
			</div>
		</div>
		<div class="col-12 col-md-6">
			<div class="d-flex flex-column w-100">
				<div class="mb-2">
					<CustomFormNumeric id="seats" bind:value={newVehicleType.seats} size={6} caption="Liczba miejsc (włączając kierowcę)" />
				</div>
				<section class="mb-2">
					<label for="x">Opcje optymalizacji</label>
					<CustomFormCheckSwitch bind:checked={newVehicleType.premium} caption="Premium" class="mb-2" />
					<CustomFormCheckSwitch bind:checked={newVehicleType.xl} caption="XL / Van" class="mb-2" />
					<CustomFormCheckSwitch bind:checked={newVehicleType.eco} caption="Eco / Green" class="mb-2" />
				</section>
			</div>
		</div>
	</div>
	<CustomFormTextarea bind:value={newVehicleType.notes} caption="Notatka" />
</CardForm>
