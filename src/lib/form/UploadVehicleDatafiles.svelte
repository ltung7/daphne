<script lang="ts">
	import UploadDatafilesComponent from 'upload-datafiles-comp';
	import datafiles from '$lib/datafiles/vehicle/index';
	import type { VehicleDocumentResult } from '$lib/datafiles/vehicle/index';
	import IconButton from '$lib/misc/IconButton.svelte';
	import ClosableModal from '$lib/misc/ClosableModal.svelte';
	import CustomFormRadio from './CustomFormRadio.svelte';
	import { vehicleDocumentCategories, vehicleDocumentNames, updatableVehicleVariables, vehicleVariableNames } from '$lib/assets/constants';
	import { createDocumentUpload } from './useDocumentUpload.svelte';

	interface Props {
		onFinished: (doc: Vehicle.VehicleDocument) => any;
		onProcessed: (result: VehicleDocumentResult) => any;
		registrationNumber: string;
	}

	let { onFinished, onProcessed, registrationNumber }: Props = $props();

	const upload = createDocumentUpload<Vehicle.DocumentType, VehicleDocumentResult, string>({
		getId: () => registrationNumber,
		idLabel: 'vehicle',
		gcsPrefix: 'v',
		documentNames: vehicleDocumentNames,
		documentCategories: vehicleDocumentCategories,
		updatableVariables: updatableVehicleVariables,
		variableNames: vehicleVariableNames,
		validateResult: (result, id) => {
			if (result.vehicle?.length && result.vehicle !== id) {
				return `Niepoprawny numer rejestracyjny: ${result.vehicle}`;
			}
			return null;
		},
		getOnFinished: () => onFinished,
		getOnProcessed: () => onProcessed
	});
</script>

<IconButton icon="upload" caption="Dodaj pliki" onclick={upload.openUploader} size={6} />

<ClosableModal bind:isOpen={upload.showUploader} headerText="Wgraj pliki" onClick={upload.upload} buttonCaption={upload.uploadable && 'Zapisz'} size="lg">
	<UploadDatafilesComponent {datafiles} on:processed={upload.handleProcessed} on:start={upload.startNewFile} on:error={upload.handleError} on:uploaded={upload.handleUploaded} containerClasses="border border-dashed bg-light border-white border-radius-xl w-100 p-4 flex-center flex-column border-2 position-relative overflow-hidden text-dark" />
	{#if upload.result}
		<section class="mt-3 pt-3 border-top text-dark text-center fs-5">
			Zidentyfikowano plik jako <b>{vehicleDocumentNames[upload.result.type]}</b>
			{#if upload.result.vehicle?.length}
				dla pojazdu <b>{upload.result.vehicle}</b>{/if}

			<div class="mt-3 fs-6">Dodatkowe informacje</div>
			<div class="datatable">
				<table class="table table-centered table-bordered">
					<tbody>
						<tr>
							<td>Nazwa pliku</td>
							<td>{upload.result.name}</td>
						</tr>
						{#each updatableVehicleVariables as key}
							{@const value = upload.resultValue(upload.result, key)}
							{#if key in upload.result}
								<tr>
									<td>{vehicleVariableNames[key]}</td>
									<td>{value}</td>
								</tr>
							{/if}
						{/each}
					</tbody>
				</table>
			</div>

			{#if upload.fileExists}
				<h6 class="text-success mt-3 mb-0">Plik jest już w bazie dokumentów</h6>
			{/if}
		</section>
	{/if}
	{#if upload.isUnidentified}
		<section class="mt-4">
			<h5 class="text-center">Nie rozpoznano rodzaju pliku. Wybierz jeden z poniższych</h5>
			<div class="row">
				{#each vehicleDocumentCategories as cat}
					<div class="col-12 col-md-6 mb-3">
						<div class="fw-bold fs-6 mb-2">{cat.name}</div>
						{#each cat.fields as type}
							<CustomFormRadio name="unidentifiedDocumentType" value={type} caption={vehicleDocumentNames[type]} onChange={upload.onSelectTypeChange} />
						{/each}
					</div>
				{/each}
			</div>
		</section>
	{/if}
</ClosableModal>