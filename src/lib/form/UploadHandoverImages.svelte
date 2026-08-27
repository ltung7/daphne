<script lang="ts">
	import { endLoad, startLoad, wrapLoader } from '$lib/nav/loader';
	import { addToast } from '$lib/toast';
	import { deserialize } from '$app/forms';
	import { md5 } from 'hash-wasm';
	import CustomFormRadio from './CustomFormRadio.svelte';
	import Dropzone from 'svelte-file-dropzone';
	import IconButton from '$lib/misc/IconButton.svelte';
	import ClosableModal from '$lib/misc/ClosableModal.svelte';
	import CameraCapture from '$lib/misc/CameraCapture.svelte';

	interface Props {
		onUploaded: (url: string) => any;
		handoverId: string;
	}

	let { onUploaded, handoverId }: Props = $props();
	const categories: Array<[DocumentGenerator.HandoverImageType, string]> = [
		[ 'image', 'Zdjęcie kontrolne pojazdu' ],
		[ 'signedprintout', 'Podpisany protokół' ]
	];

	let selectedType: DocumentGenerator.HandoverImageType = $state('image');
	let showUploader = $state(false);
	let showCamera = $state(false);
	let capturedImage: ArrayBuffer | undefined = $state();

	const oncapture = (image: ArrayBuffer) => {
		capturedImage = image;
	};

	const saveImage = () => {
		if (!capturedImage) return addToast("Brak zdjęcia")
		// Convert ArrayBuffer to File with .png extension
		const blob = new Blob([ capturedImage ], { type: 'image/png' });
		const file = new File([ blob ], 'captured-image.png', { type: 'image/png' });
		uploadTemp(file);
		capturedImage = undefined;
	};

	const openUploader = () => {
		showUploader = true;
	};

	const openCamera = () => {
		showCamera = true;
	};

	const checkHashUrl = async (file: File, bucket: App.BucketName) => {
		const arr = await file.arrayBuffer();
		const buffer = new Uint8Array(arr);
		const hash = await md5(buffer);
		const extenstion = file.name.split('.').pop();

		const url = `https://storage.googleapis.com/${bucket}/${hash}.${extenstion}`;
		try {
			const response = await fetch(url, {
				method: 'HEAD'
			});
			return response.ok && url;
		} catch (_) {
			return false;
		}
	};

	const uploadTemp = async (file: File) => {
		const checked = await checkHashUrl(file, 'mpt_tmp_imgs');
		if (checked) {
			onUploaded(checked);
			return;
		}

		const formData = new FormData();
		formData.append('file', file);
		const response = (await wrapLoader(
			fetch('/documents/temp', {
				method: 'POST',
				body: formData
			})
				.then((res) => res.text())
				.then((raw) => deserialize<{ success: boolean; url: string }, Record<string, unknown>>(raw))
		)) as { type: string; status: number; data: { success: boolean; url: string } };
		onUploaded(response.data.url);
	};

	const uploadHandoverProtocolImage = async (file: File) => {
		const checked = await checkHashUrl(file, 'feed-cdn-files');
		if (checked) {
			onUploaded(checked);
			return;
		}

		const formData = new FormData();
		formData.append('file', file);
		formData.append('data', JSON.stringify({ type: selectedType, handoverId }));

		const response = (await wrapLoader(
			fetch('/documents/upload', {
				method: 'POST',
				body: formData
			})
				.then((res) => res.text())
				.then((raw) => deserialize<{ success: boolean; url: string }, Record<string, unknown>>(raw))
		)) as { type: string; status: number; data: { success: boolean; url: string } };
		onUploaded(response.data.url);
	};

	const processFile = async (file: File) => {
		startLoad();
		if (handoverId.length) {
			await uploadHandoverProtocolImage(file);
		} else {
			await uploadTemp(file);
		}
		endLoad();
	};

	async function handleFilesSelect(e: CustomEvent) {
		if (e.detail.acceptedFiles.length) {
			for (const file of e.detail.acceptedFiles) {
				await processFile(file);
			}
		} else {
			const message = e.detail.fileRejections.length && e.detail.fileRejections[0].errors.length && e.detail.fileRejections[0].errors[0].message;
			if (message) addToast('B\u0142\u0105d podczas dodawania pliku: ' + message);
			else addToast('B\u0142\u0105d podczas dodawania pliku');
		}
	}
</script>

<div class="flex-center gap-3">
	<IconButton icon="upload" caption="Dodaj pliki" onclick={openUploader} size={6} />
	<span class="text-muted small">lub</span>
	<IconButton icon="camera" caption="Zrób zdjęcie" onclick={openCamera} size={6} />
</div>

<ClosableModal bind:isOpen={showUploader} headerText="Wgraj pliki" size="lg">
	<Dropzone multiple on:drop={handleFilesSelect} containerClasses="border border-dashed bg-light border-white border-radius-xl w-100 p-4 flex-center flex-column border-2 position-relative overflow-hidden text-dark" disableDefaultStyles accept="image/*">
		<div style="padding-top: 1rem; padding-bottom: 1rem">
			<svg xmlns="http://www.w3.org/2000/svg" width="2em" height="2em" viewBox="0 0 24 24">
				<path fill="currentColor" d="M24,12.5c0,2.513-1.247,4.736-3.15,6.098,.093-.519,.15-1.052,.15-1.598,0-.416-.038-.823-.093-1.224,.683-.916,1.093-2.048,1.093-3.276,0-2.687-1.919-4.966-4.563-5.42l-.588-.101-.19-.564c-.893-2.641-3.368-4.415-6.158-4.415-3.584,0-6.5,2.916-6.5,6.5,0,.614,.085,1.22,.253,1.801l.219,.76-.688,.389c-1.1,.621-1.783,1.79-1.783,3.051,0,1.033,.393,1.953,1.005,2.594,.009,.912,.152,1.792,.413,2.619-1.983-.73-3.418-2.789-3.418-5.213,0-1.722,.811-3.334,2.157-4.367-.104-.535-.157-1.082-.157-1.633C2,3.813,5.813,0,10.5,0c3.453,0,6.537,2.079,7.848,5.23,3.309,.834,5.652,3.803,5.652,7.27Zm-5,4.5c0,3.859-3.141,7-7,7s-7-3.141-7-7,3.141-7,7-7,7,3.141,7,7Zm-2,0c0-2.757-2.243-5-5-5s-5,2.243-5,5,2.243,5,5,5,5-2.243,5-5Zm-4.256-2.687c-.417-.417-1.093-.417-1.51,0l-2.687,2.687h2.454v3h2v-3h2.431l-2.688-2.687Z" />
			</svg>
		</div>
		<div><strong>Dodaj zdjęcia</strong></div>
	</Dropzone>

	<section class="mt-4">
		<h5 class="text-center">Rodaj dodawanego pliku</h5>
		<div class="row">
			{#each categories as [ type, caption ]}
				<div class="col-12 col-md-6">
					<CustomFormRadio bind:selected={selectedType} name="unidentifiedDcumentType" value={type} {caption} />
				</div>
			{/each}
		</div>
	</section>
</ClosableModal>

<ClosableModal bind:isOpen={showCamera} headerText="Zwrób zdjęcie" size="lg" buttonCaption={capturedImage && 'Zapisz'} onClick={saveImage}>
	<CameraCapture {oncapture} asArrayBuffer onreset={() => capturedImage = undefined } onclose={() => capturedImage = undefined } />
</ClosableModal>
