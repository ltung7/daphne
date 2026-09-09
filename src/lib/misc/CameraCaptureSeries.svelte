<script lang="ts" generics="T extends string">
	import CameraCapture from './CameraCapture.svelte';
	import IconButton from './IconButton.svelte';
	import { untrack } from 'svelte';
	import HeadlessModal from './HeadlessModal.svelte';
	import { md5 } from 'hash-wasm';
	import { uploadTempFile } from '$lib/utils/uploadTempFile';

	interface CameraCaptureSeriesStep<T extends string> {
		src: any;
		step: number;
		type: T;
		caption: string;
	}

	let {
		steps,
		onfinished
	}: {
		steps: CameraCaptureSeriesStep<T>[];
		onfinished?: (progress: SvelteCustom.SavedProgress<T>) => void;
	} = $props();

	const nextStep = () => {
		const currentIndex = steps.findIndex((s) => s.step === step.step);
		const nextIndex = currentIndex + 1;

		if (nextIndex < steps.length) {
			step = steps[nextIndex];
			return;
		}

		const firstEmpty = steps.find((s) => !progress[s.type]);
		if (firstEmpty) {
			step = firstEmpty;
			return;
		}

		onfinished?.(progress);
		isOpen = false;
	};

	const handleAccept = async (buffer: ArrayBuffer) => {
		const hash = await md5(new Uint8Array(buffer));
		const filename = hash + '.jpg';
		const file = new File([ buffer ], filename, { type: 'image/jpeg' });
		const stored = await uploadTempFile(file);

		progress[step.type] = stored;

		nextStep();
		cameraCapture?.retake();
	};

	let step = $state(untrack(() => steps[0]));
	let isOpen = $state(false);
	let cameraCapture: { retake: () => void } | undefined = $state();
	let progress: SvelteCustom.SavedProgress<T> = $state({});
</script>

<HeadlessModal bind:isOpen fullscreen>
    <h3 class="text-center">{step.caption}</h3>
	<CameraCapture overlay={step.src} onaccept={handleAccept} bind:this={cameraCapture} asArrayBuffer />
	<hr />
	<div class="row justify-content-center">
		{#each steps as step}
			<div class="col-12 col-md-6 col-lg-2">
				<div class="flex-column d-flex">
					<img src={progress[step.type]?.src || step.src} alt={step.caption} class="w-100 mw-100 rounded" />
					<div class="text-center">{step.caption}</div>
				</div>
			</div>
		{/each}
	</div>
</HeadlessModal>

<IconButton icon="camera" caption="Wykonaj zdjęcia" size={6} onclick={() => (isOpen = !isOpen)} />
