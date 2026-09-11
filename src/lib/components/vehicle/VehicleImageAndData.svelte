<script lang="ts">
	import { fuelNames } from '$lib/assets/constants';
	import CustomFormColorPicker from '$lib/form/CustomFormColorPicker.svelte';
	import VehicleStatus from '$lib/misc/VehicleStatus.svelte';
	import ExpirationDate from '$lib/misc/ExpirationDate.svelte';

	interface Props {
		vehicle: Vehicle.Vehicle;
	}

	const { vehicle }: Props = $props();
</script>

<div class="d-flex">
	<div class="vehicle-image rounded">
		<img src={vehicle.imageUrl ?? '/img/generic.jpg'} alt={vehicle.name} />
	</div>

	<div class="w-100 ms-3">
		<table class="table table-striped small mb-0">
			<tbody>
				<tr>
					<td>Status</td>
					<td class="py-1">
						<VehicleStatus status={vehicle.status} />
					</td>
				</tr>
				<tr>
					<td>Marka</td>
					<td class="w-75">
						{vehicle.name}
					</td>
				</tr>
				<tr>
					<td>Rodzaj paliwa</td>
					<td>{fuelNames[vehicle.fuelType]}</td>
				</tr>
				<tr>
					<td>Data pierwszej rejestracji</td>
					<td>{vehicle.firstRegistrationDate}</td>
				</tr>
				<tr>
					<td>Kolor</td>
					<td class="py-1">
						<CustomFormColorPicker value={vehicle.color} disabled class="mb-0" />
					</td>
				</tr>
				<tr>
					<td>Termin ważności ubezpieczenia</td>
					<td><ExpirationDate date={vehicle.insuranceExpiration} /></td>
				</tr>
				<tr>
					<td>Termin ważności badania</td>
					<td><ExpirationDate date={vehicle.technicalExpiration} /></td>
				</tr>
			</tbody>
		</table>
	</div>
</div>
