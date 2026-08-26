<script lang="ts">
	import { untrack } from 'svelte';
	import type { PageProps } from './$types';
	import EditNotesCard from '$lib/form/EditNotesCard.svelte';
	import plTimezone, { formatTimezone } from '$lib/utils/tz';
	import DriverStatus from '$lib/misc/DriverStatus.svelte';
	import UploadDriverDatafiles from '$lib/form/UploadDriverDatafiles.svelte';
	import TooltipSquareIconLink from '$lib/misc/TooltipSquareIconLink.svelte';
	import { driverDocumentNames, languageLevels, languages } from '$lib/assets/constants';
	import DriverVerification from '$lib/components/DriverVerification.svelte';

	let { data }: PageProps = $props();
	let driver: Driver.Driver = $state(untrack(() => data.driver));
	let documents: Driver.DriverDocument[] = $state(untrack(() => data.documents));

	const onFinished = (doc: Driver.DriverDocument) => {
		if (documents.find((d) => d.id !== doc.id)) documents.push(doc);
	};

	const languageNames = languages.reduce((obj, item) => {
		obj[item[0]] = item[2];
		return obj;
	}, {} as Record<string, string>)
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
								<td class="py-1">
									<DriverStatus status={driver.status} />
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
								<td>{languageLevels[driver.polishLanguage] ?? driver.polishLanguage}</td>
							</tr>
							{#each Object.entries(driver.additionalLanguages) as [ lang, level ]}
								<tr>
									<td>Język {languageNames[lang] ?? lang.toLowerCase()}</td>
									<td>{languageLevels[level] ?? level}</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			</div>
			{#if driver.status === 'pending_verification'}
				<div class="card-footer flex-center">
					<DriverVerification {driver} {documents} />
				</div>
			{/if}
		</div>
		<div class="card mt-3">
			<h5 class="card-header">Dodane dokumenty</h5>
			<div class="card-body">
				{#if documents?.length}
					<ul class="list-group">
						{#each documents as doc}
							<li class="list-group-item flex-between">
								<div>
									<div class="text-muted xsmall">{driverDocumentNames[doc.type]} ({plTimezone(doc.timestamp)})</div>
									<div class="fw-bold text-dark">{doc.name}</div>
								</div>
								<TooltipSquareIconLink class="me-n2" href={doc.url} download icon="cloud-download-alt" hoverText="Pobierz" blank />
							</li>
						{/each}
					</ul>
				{:else}
					Brak dodanych dokumentów
				{/if}
			</div>
			<div class="card-footer d-flex justify-content-end">
				<UploadDriverDatafiles {onFinished} driverId={driver.id} />
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
							<img src={driver.assignedVehicle.imageUrl} alt={driver.assignedVehicle.model} style="max-height: 200px;" />
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
