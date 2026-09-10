<script lang="ts" generics="T extends string">
	import MobileCameraCapture from './MobileCameraCapture.svelte';
	import IconButton from './IconButton.svelte';
	import { untrack } from 'svelte';
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

	const handleClose = () => {
		onfinished?.(progress);
		isOpen = false;
	};

	let step = $state(untrack(() => steps[0]));
	let isOpen = $state(false);
	let cameraCapture: { retake: () => void } | undefined = $state();
	let progress: SvelteCustom.SavedProgress<T> = $state({});
</script>

{#if isOpen}
	<div class="position-fixed top-0 start-0 w-100 h-100 z-index-1050 bg-dark d-flex flex-column">
		<!-- Desktop: caption above thumbnails -->
		<div class="d-none d-md-block p-3 text-center">
			<h5 class="mb-3">{step.caption}</h5>
		</div>

		<MobileCameraCapture overlay={step.src} overlayText={step.caption} onaccept={handleAccept} onclose={handleClose} bind:this={cameraCapture} asArrayBuffer />

		<!-- Progress thumbnails at bottom -->
		<div class="p-3 bg-dark border-top d-none d-md-block">
			<div class="row justify-content-center">
				{#each steps as s}
					<div class="col-12 col-md-6 col-lg-2 mb-2">
						<div class="flex-column d-flex">
							<img src={progress[s.type]?.src || s.src} alt={s.caption} class="w-100 mw-100 rounded" />
							<div class="text-center small text-white-50">{s.caption}</div>
						</div>
					</div>
				{/each}
			</div>
		</div>
	</div>
{/if}

<IconButton icon="camera" caption="Wykonaj zdjęcia" size={6} onclick={() => (isOpen = !isOpen)} />
