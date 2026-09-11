<script lang="ts">
	import type { PageProps } from './$types';
	import SectionCard from '$lib/misc/SectionCard.svelte';
	import PageTitle from '$lib/misc/PageTitle.svelte';
	import EditNotesCard from '$lib/form/EditNotesCard.svelte';
	import { untrack } from 'svelte';
	import { fuelNames } from '$lib/assets/constants';

	let { data }: PageProps = $props();
	let type = $state(untrack(() => data.vehicleType));
</script>

<PageTitle title={type.name} subtitle="Szczegóły typu pojazdu" />

<SectionCard title="Konfiguracja wspólna">
	<div class="d-flex">
		<div class="vehicle-image rounded">
			<img src={type.image ?? '/img/generic.jpg'} alt={type.name} />
		</div>

		<div class="w-100 ms-3">
			<table class="table table-striped small mb-0">
				<tbody>
					<tr>
						<td>Nazwa</td>
						<td>{type.name}</td>
					</tr>
					<tr>
						<td>Marka/Model</td>
						<td>{type.makeModel}</td>
					</tr>
					<tr>
						<td>Rodzaj paliwa</td>
						<td>{fuelNames[type.fuelType]}</td>
					</tr>
					<tr>
						<td>Skrzynia biegów</td>
						<td>{type.transmission}</td>
					</tr>
					<tr>
						<td>Wymagana kategoria prawa jazdy</td>
						<td>{type.requiredDrivingLicense}</td>
					</tr>
					<tr>
						<td>Liczba miejsc</td>
						<td>{type.seats}</td>
					</tr>
				</tbody>
			</table>
		</div>
	</div>
</SectionCard>

<SectionCard title="Konfiguracja platform">
	<div class="form-check">
		<input class="form-check-input opacity-10" type="checkbox" id="chklist_premium" checked={type.premium} disabled />
		<label class="form-check-label ms-2 opacity-10 text-dark" for="chklist_premium">Premium</label>
	</div>
	<div class="form-check">
		<input class="form-check-input opacity-10" type="checkbox" id="chklist_xl" checked={type.xl} disabled />
		<label class="form-check-label ms-2 opacity-10 text-dark" for="chklist_xl">XL</label>
	</div>
	<div class="form-check">
		<input class="form-check-input opacity-10" type="checkbox" id="chklist_eco" checked={type.eco} disabled />
		<label class="form-check-label ms-2 opacity-10 text-dark" for="chklist_eco">Eko</label>
	</div>
	<div class="form-check">
		<input class="form-check-input opacity-10" type="checkbox" id="chklist_foodDelivery" checked={type.foodDelivery} disabled />
		<label class="form-check-label ms-2 opacity-10 text-dark" for="chklist_foodDelivery">Dostawa jedzenia</label>
	</div>
</SectionCard>

<EditNotesCard bind:notes={type.notes} />
