<script lang="ts">
	import { endLoad, startLoad, wrapLoader } from '$lib/nav/loader';
	import { addToast } from '$lib/toast';
	import UploadDatafilesComponent, { type DataFilePreprocessResult } from 'upload-datafiles-comp';
	import datafiles, { type VehicleDocumentResult } from '$lib/datafiles/vehicle/index';
	import IconButton from '$lib/misc/IconButton.svelte';
	import ClosableModal from '$lib/misc/ClosableModal.svelte';
	import { deserialize } from '$app/forms';
	import { md5 } from 'hash-wasm';
	import { documentCategories, documentNames, updatableVehicleVariables, vehicleVariableNames } from '$lib/assets/constants';
	import CustomFormRadio from './CustomFormRadio.svelte';

	interface Props {
		onFinished: (doc: Vehicle.VehicleDocument) => any;
		onProcessed: (result: VehicleDocumentResult) => any;
		registrationNumber: string;
	}

	let { onFinished, onProcessed, registrationNumber }: Props = $props();

	let uploaded: File | undefined = $state();
	let result: VehicleDocumentResult | undefined = $state();
	let processed: boolean = $state(false);
	let fileExists: boolean = $state(false);
	let isUnidentified: boolean = $state(true);
	let selectedType: string | undefined = $state();
	let uploadable: boolean = $derived((processed && !fileExists) || (isUnidentified && Boolean(selectedType)));

	const handleUploaded = async (e: CustomEvent<File>) => {
		uploaded = e.detail;
		const arr = await uploaded.arrayBuffer();
		const buffer = new Uint8Array(arr);
		const hash = await md5(buffer);
		fileExists = await checkHashUrl(hash);
	};

	const startNewFile = () => {
		startLoad();
		isUnidentified = false;
		fileExists = false;
		processed = false;
		result = undefined;
		uploaded = undefined;
		selectedType = undefined;
	};

	const handleProcessed = (e: CustomEvent<DataFilePreprocessResult<VehicleDocumentResult>>) => {
		endLoad();
		result = e.detail.result;
		if (result.vehicle.length && result.vehicle !== registrationNumber) {
			addToast(`Niepoprawny numer rejestracyjny: ${result.vehicle}`);
			return;
		}
		onProcessed(result);
		processed = true;
	};

	const handleError = (e: CustomEvent<string>) => {
		isUnidentified = e.detail === 'Specyfikacja nie została rozpoznana';
		addToast(e.detail);
		endLoad();
	};

	let showUploader = $state(false);
	const openUploader = () => {
		showUploader = true;
	};

	const upload = async () => {
		if (!uploaded) return;
		const formData = new FormData();
		formData.append('file', uploaded);
		if (isUnidentified) {
			const type = selectedType as Vehicle.DocumentType;
			result = {
				name: documentNames[type],
				type,
				vehicle: registrationNumber
			};
		}
		formData.append('data', JSON.stringify(result));
		const response = (await wrapLoader(
			fetch('/documents/upload', {
				method: 'POST',
				body: formData
			})
				.then((res) => res.text())
				.then((raw) => deserialize<{ success: boolean; url: string }, Record<string, unknown>>(raw))
		)) as { type: string; status: number; data: { success: boolean; doc: Vehicle.VehicleDocument } };
		onFinished(response.data.doc);
	};

	const checkHashUrl = async (hash: string) => {
		const url = `https://storage.googleapis.com/feed-cdn-files/v/${registrationNumber}/${hash}.pdf`;
		try {
			const response = await fetch(url, {
				method: 'HEAD'
			});
			return response.ok;
		} catch (_) {
			return false;
		}
	};

	const onSelectTypeChange = (value: string) => {
		selectedType = value;
	};

	const resultValue = (result: VehicleDocumentResult, key: string) => {
		const value = result[key as keyof VehicleDocumentResult];
		if (value) return value;
		return false;
	}
</script>

<IconButton icon="upload" caption="Dodaj pliki" onclick={openUploader} size={6} />

<ClosableModal bind:isOpen={showUploader} headerText="Wgraj pliki" onClick={upload} buttonCaption={uploadable && 'Zapisz'} size="lg">
	<UploadDatafilesComponent {datafiles} on:processed={handleProcessed} on:start={startNewFile} on:error={handleError} on:uploaded={handleUploaded} containerClasses="border border-dashed bg-light border-white border-radius-xl w-100 p-4 flex-center flex-column border-2 position-relative overflow-hidden text-dark" />
	{#if result}
		<section class="mt-3 pt-3 border-top text-dark text-center fs-5">
			Zidentyfikowano plik jako <b>{documentNames[result.type]}</b>
			{#if result.vehicle?.length}
				dla pojazdu <b>{result.vehicle}</b>{/if}

			<div class="mt-3 fs-6">Dodatkowe informacje</div>
			<div class="datatable">
				<table class="table table-centered table-bordered">
					<tbody>
						<tr>
							<td>Nazwa pliku</td>
							<td>{result.name}</td>
						</tr>
						{#each updatableVehicleVariables as key}
							{@const value = resultValue(result, key)}
							{#if key in result}
								<tr>
									<td>{vehicleVariableNames[key]}</td>
									<td>{value}</td>
								</tr>
							{/if}
						{/each}
					</tbody>
				</table>
			</div>

			{#if fileExists}
				<h6 class="text-success mt-3 mb-0">Plik jest już w bazie dokumentów</h6>
			{/if}
		</section>
	{/if}
	{#if isUnidentified}
		<section class="mt-4">
			<h5 class="text-center">Nie rozpoznano rodzaju pliku. Wybierz jeden z poniższych</h5>
			<div class="row">
				{#each documentCategories as cat}
					<div class="col-12 col-md-6 mb-3">
						<div class="fw-bold fs-6 mb-2">{cat.name}</div>
						{#each cat.fields as type}
							<CustomFormRadio name="unidentifiedDcumentType" value={type} caption={documentNames[type]} onChange={onSelectTypeChange} />
						{/each}
					</div>
				{/each}
			</div>
		</section>
	{/if}
</ClosableModal>
