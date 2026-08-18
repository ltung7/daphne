<script lang="ts">
	import { endLoad, startLoad, wrapLoader } from '$lib/nav/loader';
	import { addToast } from '$lib/toast';
	import UploadDatafilesComponent, { type DataFilePreprocessResult } from 'upload-datafiles-comp';
	import datafiles, { type VehicleDocumentResult } from '$lib/datafiles/vehicle/index';
	import IconButton from '$lib/misc/IconButton.svelte';
	import ClosableModal from '$lib/misc/ClosableModal.svelte';
	import { deserialize } from '$app/forms';

	interface Props {
		onFinished: (result: Vehicle.VehicleDocument) => any;
	}

	let { onFinished }: Props = $props();

	let uploaded: File | undefined = $state();
	let result: VehicleDocumentResult | undefined = $state();
	let buttonCaption: false | string = $state(false);

	const handleUploaded = (e: CustomEvent<File>) => {
		uploaded = e.detail;
	};

	const handleProcessed = (e: CustomEvent<DataFilePreprocessResult<VehicleDocumentResult>>) => {
		endLoad();
		result = e.detail.result;
		buttonCaption = 'Zapisz';
	};

	const handleError = (e: CustomEvent<string>) => {
		if (e.detail === 'Specyfikacja nie została rozpoznana') {
			console.log(':UNSPEC');
		}
		addToast(e.detail);
		endLoad();
	};

	let showUploader = $state(false);
	const openUploader = () => {
		showUploader = true;
	};

	const upload = async () => {
		if (!uploaded || !result) return;
		const formData = new FormData();
		formData.append('file', uploaded);
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
</script>

<IconButton icon="upload" caption="Dodaj pliki" onclick={openUploader} size={6} />

<ClosableModal bind:isOpen={showUploader} headerText="Wgraj pliki" onClick={upload} {buttonCaption}>
	<UploadDatafilesComponent {datafiles} on:processed={handleProcessed} on:start={startLoad} on:error={handleError} on:uploaded={handleUploaded} containerClasses="border border-dashed bg-light border-white border-radius-xl w-100 p-4 flex-center flex-column border-2 position-relative overflow-hidden text-dark" />
	{#if result}
		<section class="mt-3 pt-3 border-top text-dark text-center fs-5">
			Zidentyfikowano plik jako <b>{result.type}</b>
			{#if result.vehicle?.length}
				dla pojazdu <b>{result.vehicle}</b>{/if}

			{#if result.type === 'oc_insurance_policy'}
				<div class="mt-3 fs-6">Dodatkowe informacje</div>
				<div class="datatable">
					<table class="table table-centered table-bordered">
						<tbody>
							<tr>
								<td>Numer polisy</td>
								<td>{result.name}</td>
							</tr>
							<tr>
								<td>Data ważności</td>
								<td>{result.expirationDate}</td>
							</tr>
						</tbody>
					</table>
				</div>
			{/if}
		</section>
	{/if}
</ClosableModal>
