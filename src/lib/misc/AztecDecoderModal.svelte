<script lang="ts">
	import { internal } from '$lib/nav/internal';
	import { slide } from 'svelte/transition';
	import ClosableModal from './ClosableModal.svelte';
	type VehicleAndType = { vehicle: Vehicle.Vehicle, type: Vehicle.Type }
	interface Props {
		isOpen: boolean;
		onselect?: (vehicleAndType: VehicleAndType) => any
	}

	let { isOpen = $bindable(false), onselect }: Props = $props();
	let b64Input: string = $state('');
	let vehicleAndType: VehicleAndType | undefined = $state();

	const decode = async (e: Event) => {
		if (e.preventDefault) e.preventDefault();
		const response = await internal.post('/api/aztec', { b64Input });
		if (response.vehicle) vehicleAndType = response
	};

	const handleAccept = () => {
		if (vehicleAndType) onselect?.(vehicleAndType)
		isOpen = false;
	}
</script>

<ClosableModal bind:isOpen headerText="Skanuj dowód rejestracyjny" size="lg" buttonCaption={vehicleAndType && "Wykorzystaj dane"} onClick={handleAccept}>
<div class="text-center">
	<h5>Skanuj dowód rejestracyjny</h5>
	<p>Wklej lub zeskanuj kod Aztec z polskiego dowodu rejestracyjnego pojazdu</p>
	<form class="flex-column flex-center" onsubmit={decode}>
		<input class="form-control my-3" id="aztec-input" type="text" bind:value={b64Input} onchange={decode} placeholder="Wklej kod Aztec w formacie base64..." />
		<button type="submit" class="btn btn-sm btn-primary">Sprawdź</button>
	</form>

	{#if vehicleAndType}
		<div class="datatable border-top pt-3 mt-3" transition:slide>
			<h5>Odczytane dane:</h5>
			<table class="table table-centered table-striped">
				<tbody>
					<tr>
						<td>Data pierwszej rejestracji</td>
						<td>{vehicleAndType.vehicle.firstRegistrationDate}</td>
					</tr>
					<tr>
						<td>Marka i model</td>
						<td>{vehicleAndType.vehicle.modelMake}</td>
					</tr>
					<tr>
						<td>Numer rejestracyjny</td>
						<td>{vehicleAndType.vehicle.registrationNumber}</td>
					</tr>
					<tr>
						<td>VIN</td>
						<td>{vehicleAndType.vehicle.vin}</td>
					</tr>
				</tbody>
			</table>
		</div>
	{/if}
	</div>
</ClosableModal>
