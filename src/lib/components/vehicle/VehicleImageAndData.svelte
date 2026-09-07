<script lang="ts">
	import { fuelNames } from '$lib/assets/constants';
	import VehicleStatus from '$lib/misc/VehicleStatus.svelte';

	interface Props {
		vehicle: Vehicle.Vehicle;
	}

	const { vehicle }: Props = $props();

	const toDate = (iso: string): Date => {
		const [ y, m, d ] = iso.split('-').map(Number);
		return new Date(y, m - 1, d);
	};

	const calculateDaysBefore = (iso: string) => {
		const date = toDate(iso);
		const ms = date.valueOf() - Date.now();
		return Math.ceil(ms / 86400000);
	};
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
					<td>Termin ważności ubezpieczenia</td>
					<td>{vehicle.insuranceExpiration} <span class="text-muted">(za {calculateDaysBefore(vehicle.insuranceExpiration)} dni)</span></td>
				</tr>
				<tr>
					<td>Termin ważności badania</td>
					<td>{vehicle.technicalExpiration} <span class="text-muted">(za {calculateDaysBefore(vehicle.technicalExpiration)} dni)</span></td>
				</tr>
			</tbody>
		</table>
	</div>
</div>
