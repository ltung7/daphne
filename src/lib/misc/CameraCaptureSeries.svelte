<script lang="ts" generics="T extends string">
	import ClosableModal from './ClosableModal.svelte';
	import CameraCapture from './CameraCapture.svelte';
	import IconButton from './IconButton.svelte';
	import { untrack } from 'svelte';
	import HeadlessModal from './HeadlessModal.svelte';

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
		onfinished?: (progress: Record<T, string>) => void;
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

	const handleAccept = (image: string) => {
		progress[step.type] = image;
		nextStep();
		cameraCapture?.retake();
		console.log(progress);
	};

	let step = $state(untrack(() => steps[0]));
	let isOpen = $state(false);
	let cameraCapture: { retake: () => void } | undefined = $state();
	let progress: Record<T, string> = $state(
		untrack(() => Object.fromEntries(steps.map((s) => [ s.type, '' ])) as Record<T, string>)
	);
</script>

<HeadlessModal bind:isOpen fullscreen>
    <h3 class="text-center">{step.caption}</h3>
	<CameraCapture overlay={step.src} onaccept={handleAccept} bind:this={cameraCapture} />
	<hr />
	<div class="row justify-content-center">
		{#each steps as step}
			<div class="col-12 col-md-6 col-lg-2">
				<div class="flex-column d-flex">
					<img src={progress[step.type] || step.src} alt={step.caption} class="w-100 mw-100 rounded" />
					<div class="text-center">{step.caption}</div>
				</div>
			</div>
		{/each}
	</div>
</HeadlessModal>

<IconButton icon="camera" caption="Wykonaj zdjęcia" size={6} onclick={() => (isOpen = !isOpen)} />
