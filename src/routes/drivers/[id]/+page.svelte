<script lang="ts">
	import { untrack } from "svelte";
	import type { PageProps } from "./$types";
	import EditNotesCard from "$lib/form/EditNotesCard.svelte";
	import { formatTimezone } from "$lib/utils/tz";

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
				<div class="datatable">
					<table class="table table-striped table-centered">
						<tbody>
							<tr>
								<td>Status</td>
								<td>
									{driver.status}
								</td>
							</tr>
							<tr>
								<td>Login</td>
								<td>{driver.login}</td>
							</tr>
							<tr>
								<td>Imię i nazwisko</td>
								<td>{driver.name}</td>
							</tr>
							<tr>
								<td>Adres e-mail</td>
								<td><a href="mailto:{driver.email}">{driver.email}</a></td>
							</tr>
                            <tr>
								<td>Numer telefonu</td>
                            <td><a href="tel:{driver.phone}">{driver.phone}</a></td>
							</tr>
                            <tr>
								<td>Adres korespondencyjny</td>
								<td>{driver.address}</td>
							</tr>
                            <tr>
								<td>Język polski</td>
								<td>{driver.polishLanguage}</td>
							</tr>
						</tbody>
					</table>
				</div>
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
					<a class="flex-center flex-column" href="/vehicles/{driver.assignedVehicle.registrationNumber}">
						{#if driver.assignedVehicle.imageUrl}
						<img src={driver.assignedVehicle.imageUrl} alt={driver.assignedVehicle.model} style="max-height: 200px;">
						{/if}
						<h6>{driver.assignedVehicle.registrationNumber}</h6>
						<div class="text-muted small">Od {formatTimezone(driver.assignedVehicle.timestamp)}</div>
					</a>
				{:else}
					Nie przypisano żadnego pojazdu
				{/if}
			</div>
		</div>
        <EditNotesCard bind:notes={driver.notes} />
	</div>
</div>
