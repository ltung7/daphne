<script lang="ts">
	import { endLoad, startLoad, wrapLoader } from '$lib/nav/loader';
	import { addToast } from '$lib/toast';
	import UploadDatafilesComponent, { type DataFilePreprocessResult } from 'upload-datafiles-comp';
	import datafiles, { type DriverDocumentResult } from '$lib/datafiles/driver/index';
	import IconButton from '$lib/misc/IconButton.svelte';
	import ClosableModal from '$lib/misc/ClosableModal.svelte';
	import { deserialize } from '$app/forms';
	import { md5 } from 'hash-wasm';
	import { driverDocumentNames, driverDocumentCategories } from '$lib/assets/constants';
	import CustomFormRadio from './CustomFormRadio.svelte';

	interface Props {
		onFinished: (doc: Driver.DriverDocument) => any;
		onProcessed?: (result: DriverDocumentResult) => any;
		driverId: string;
	}

	let { onFinished, onProcessed, driverId }: Props = $props();

	let uploaded: File | undefined = $state();
	let result: DriverDocumentResult | undefined = $state();
	let processed: boolean = $state(false);
	let fileExists: boolean = $state(false);
	let isUnidentified: boolean = $state(false);
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

	const handleProcessed = (e: CustomEvent<DataFilePreprocessResult<DriverDocumentResult>>) => {
		endLoad();
		result = e.detail.result;
		if (result.driverId.length && result.driverId !== driverId) {
			addToast(`Niepoprawny numer rejestracyjny: ${result.driverId}`);
			return;
		}
		onProcessed?.(result);
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
			const type = selectedType as Driver.DocumentType;
			result = {
				name: driverDocumentNames[type],
				type,
				driverId
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
		)) as { type: string; status: number; data: { success: boolean; doc: Driver.DriverDocument } };
		onFinished(response.data.doc);
	};

	const checkHashUrl = async (hash: string) => {
		const url = `https://storage.googleapis.com/feed-cdn-files/d/${driverId}/${hash}.pdf`;
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

	// const resultValue = (result: DriverDocumentResult, key: string) => {
	// 	const value = result[key as keyof DriverDocumentResult];
	// 	if (value) return value;
	// 	return false;
	// }
</script>

<IconButton icon="upload" caption="Dodaj pliki" onclick={openUploader} size={6} />

<ClosableModal bind:isOpen={showUploader} headerText="Wgraj pliki" onClick={upload} buttonCaption={uploadable && 'Zapisz'} size="lg">
	<UploadDatafilesComponent {datafiles} on:processed={handleProcessed} on:start={startNewFile} on:error={handleError} on:uploaded={handleUploaded} containerClasses="border border-dashed bg-light border-white border-radius-xl w-100 p-4 flex-center flex-column border-2 position-relative overflow-hidden text-dark" />
	{#if result}
		<section class="mt-3 pt-3 border-top text-dark text-center fs-5">
			Zidentyfikowano plik jako <b>{driverDocumentNames[result.type]}</b>
			{#if result.driverId?.length}
				dla kierowcy <b>{result.driverId}</b>{/if}
			{#if fileExists}
				<h6 class="text-success mt-3 mb-0">Plik jest już w bazie dokumentów</h6>
			{/if}
		</section>
	{/if}
	{#if isUnidentified}
		<section class="mt-4">
			<h5 class="text-center">Nie rozpoznano rodzaju pliku. Wybierz jeden z poniższych</h5>
			<div class="row">
				{#each driverDocumentCategories as cat}
					<div class="col-12 col-md-6 mb-3">
						<div class="fw-bold fs-6 mb-2">{cat.name}</div>
						{#each cat.fields as type}
							<CustomFormRadio name="unidentifiedDcumentType" value={type} caption={driverDocumentNames[type]} onChange={onSelectTypeChange} />
						{/each}
					</div>
				{/each}
			</div>
		</section>
	{/if}
</ClosableModal>
