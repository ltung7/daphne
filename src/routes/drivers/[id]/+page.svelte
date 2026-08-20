<script lang="ts">
	import { untrack } from "svelte";
	import type { PageProps } from "./$types";

	let { data }: PageProps = $props();
	let driver: Driver.Driver = $state(untrack(() => data.driver));
    let documents: any[] = [];
</script>

<svelte:head>
	<title>Dane kierowcy {driver.name}</title>
</svelte:head>

<div class="row mt-n3">
	<div class="col-12 col-md-6">
		<div class="card mt-3">
			<h5 class="card-header">Dane kierowcy {driver.name}</h5>
			<div class="card-body">
				
			</div>
		</div>
		<div class="card mt-3">
			<h5 class="card-header">Dodane dokumenty</h5>
			<div class="card-body">
				{#if documents?.length}
                <!-- TODO: NEVER -->
				{:else}
					Brak dodanych dokumentów
				{/if}
			</div>
			<div class="card-footer d-flex justify-content-end">
				<!-- TODO: Upload -->
			</div>
		</div>
	</div>
	<div class="col-12 col-md-6">
		<div class="card mt-3">
			<h5 class="card-header">Pojazd</h5>
			<div class="card-body">
				{#if driver.assignedVehicle}
					Przypisano {driver.assignedVehicle.registrationNumber}
				{:else}
					Nie przypisano żadnego kierowcy
				{/if}
			</div>
		</div>
	</div>
</div>
