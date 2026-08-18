<script lang="ts">
	import DatatableWrapper from "$lib/misc/DatatableWrapper.svelte";
	import FeatCheck from "$lib/misc/FeatCheck.svelte";
	import { onMount } from "svelte";
    import names from '$lib/assets/names.json'
	import TooltipSquareIconLink from "$lib/misc/TooltipSquareIconLink.svelte";
	import { fetchVehicleTypes } from "$lib/nav/fetchData";
    const fuelNames: Record<Vehicle.FuelType, string> = names.fuel as any;

    let types: Vehicle.Type[] = $state([]);
    let loaded = $state(false)

    const loadTypes = () => {
        fetchVehicleTypes().then(list => types = list);
    }

    const headers: SvelteCustom.DatatableHeaders<keyof Vehicle.Type> = [ [ 'name', 'Nazwa' ], [ 'fuelType', 'Rodzaj paliwa' ], [ 'maxPassengers', 'Ilość pasażerów' ], [ 'premium', 'Premium' ], [ 'eco', 'Eco / Green' ], [ 'xl', 'XL / Van' ], [ 'notes', 'Notatki' ] ]

    onMount(loadTypes);
</script>

<div class="card">
    <h5 class="card-header flex-between">
        <div>Rodzaje pojazdów</div>
        <div class="my-n3">
            <TooltipSquareIconLink icon="add" hoverText="Dodaj nowy rodzaj pojazdu" href="/vehicletypes/new" size={2} />
        </div>
    </h5>
    <div class="card-body text-center">
        <DatatableWrapper {loaded} data={types} {headers}>
            {#snippet row(row)}
                <td class="py-1">
                    <TooltipSquareIconLink href="/vehicles/new?type={row.id}" icon="add" hoverText="Dodaj pojazd tego typu" size={4} />
                </td>
                <td>{row.name}</td>
                <td>{fuelNames[row.fuelType]}</td>
                <td>{row.maxPassengers}</td>
                <td class="py-1"><FeatCheck checked={row.premium} /></td>
                <td class="py-1"><FeatCheck checked={row.eco} /></td>
                <td class="py-1"><FeatCheck checked={row.xl} /></td>
                <td>{row.notes}</td>
            {/snippet}
        </DatatableWrapper>
    </div>
</div>