<script lang="ts">
	import { onDestroy, onMount } from 'svelte';
	import IconButton from './IconButton.svelte';

	type CommonProps<T> = {
		oncapture?: (image: T) => void;
		onclose?: (image: T) => void;
		onreset?: () => void;
	};

	type ComponentProps = (CommonProps<ArrayBuffer> & { asArrayBuffer: true }) | (CommonProps<string> & { asArrayBuffer?: false });

	// Annotate the declaration, not the $props rune function
	let { oncapture, onclose, onreset, asArrayBuffer }: ComponentProps = $props();
	// --- state ---
	let videoEl = $state<HTMLVideoElement | null>(null);
	let canvasEl = $state<HTMLCanvasElement | null>(null);
	let stream: MediaStream | null = null;
	let capturedImage = $state<string | ArrayBuffer | null>(null); // data URL or ArrayBuffer of captured photo
	let facingMode = $state<'user' | 'environment'>('environment');
	let error = $state<string>('');
	let isStreaming = $state<boolean>(false);
	let disabled = $state<boolean>(true);

	// The preview <img> needs a string URL; when capturing as ArrayBuffer we keep the data URL for display only.
	let capturedImageUrl = $state<string | null>(null);

	// Detect if device likely has multiple cameras (rough heuristic: mobile UA)
	const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
	let ratioClass = $state(!isMobile ? 'ratio-16x9' : window.matchMedia('(orientation: portrait)').matches ? '' : 'ratio-4x3');
	let ratioStyle = $state<string>(!isMobile ? '' : window.matchMedia('(orientation: portrait)').matches ? '--bs-aspect-ratio: 133.3333%;' : '');

	const orientationQuery = isMobile ? window.matchMedia('(orientation: portrait)') : null;

	function updateRatio(): void {
		if (!isMobile) {
			ratioClass = 'ratio-16x9';
			ratioStyle = '';
			return;
		}
		const portrait = window.matchMedia('(orientation: portrait)').matches;
		if (portrait) {
			// 3:4 has no built-in Bootstrap ratio class, set it via CSS var
			ratioClass = '';
			ratioStyle = '--bs-aspect-ratio: 133.3333%;'; // 4/3 * 100
		} else {
			ratioClass = 'ratio-4x3';
			ratioStyle = '';
		}
	}

	async function startCamera(): Promise<void> {
		disabled = true;
		error = '';
		stopCamera(); // stop any existing stream first

		try {
			stream = await navigator.mediaDevices.getUserMedia({
				video: {
					facingMode,
					width: { ideal: 1280 },
					height: { ideal: 720 }
				},
				audio: false
			});

			if (videoEl) {
				videoEl.srcObject = stream;
				await videoEl.play();
			}
			isStreaming = true;
			disabled = false;
		} catch (err) {
			console.error('Camera error:', err);
			const e = err as DOMException;
			if (e.name === 'NotAllowedError') {
				error = 'Camera permission denied. Please allow camera access.';
			} else if (e.name === 'NotFoundError') {
				error = 'No camera found on this device.';
			} else {
				error = `Could not access camera: ${e.message}`;
			}
			disabled = false;
			isStreaming = false;
		}
	}

	function stopCamera(): void {
		if (stream) {
			stream.getTracks().forEach((track) => track.stop());
			stream = null;
		}
		isStreaming = false;
	}

	function switchCamera(): void {
		facingMode = facingMode === 'user' ? 'environment' : 'user';
		startCamera();
	}

	function capturePhoto(): void {
		if (!videoEl || !isStreaming) return;

		const width = videoEl.videoWidth;
		const height = videoEl.videoHeight;

		if (canvasEl) {
			canvasEl.width = width;
			canvasEl.height = height;

			const ctx = canvasEl.getContext('2d');
			if (!ctx) return;
			ctx.drawImage(videoEl, 0, 0, width, height);

			const dataUrl = canvasEl.toDataURL('image/png', 1);
			capturedImageUrl = dataUrl; // always set for display

			if (asArrayBuffer) {
				// Convert data URL to ArrayBuffer
				const base64 = dataUrl.split(',')[1];
				const binary = atob(base64);
				const bytes = new Uint8Array(binary.length);
				for (let i = 0; i < binary.length; i++) {
					bytes[i] = binary.charCodeAt(i);
				}
				capturedImage = bytes.buffer;
				// @ts-expect-error Types mix
				oncapture?.(bytes.buffer);
			} else {
				capturedImage = dataUrl as string;
				// @ts-expect-error Types mix
				oncapture?.(dataUrl);
			}
		}

		disabled = true;
	}

	function retake(): void {
		capturedImage = null;
		capturedImageUrl = null;
		onreset?.();
		startCamera();
	}

	// Initialize ratio update
	updateRatio();
	if (orientationQuery) {
		orientationQuery.addEventListener('change', updateRatio);
	}

	onDestroy(() => {
		if (capturedImage) {
			// @ts-expect-error Types mix
			onclose?.(capturedImage);
		}
		stopCamera();
		if (orientationQuery) {
			orientationQuery.removeEventListener('change', updateRatio);
		}
	});

	onMount(() => {
		setTimeout(() => {
			startCamera();
		}, 100);
	});
</script>

<div class="mx-auto" style="max-width: 480px;">
	{#if error}
		<div class="alert alert-danger py-2 px-3" role="alert">{error}</div>
	{/if}

	{#if !capturedImage}
		<!-- Live preview -->
		<div class="ratio {ratioClass} rounded overflow-hidden bg-dark" style={ratioStyle}>
			<video bind:this={videoEl} class="w-100 h-100 object-fit-cover" playsinline muted></video>
			<!-- <svg class="guide" viewBox="0 0 100 100" preserveAspectRatio="none"> -->
				<!-- credit-card aspect ratio ~ 1.586:1, centered -->
				<!-- <rect x="10" y="35" width="80" height="30" rx="3" fill="none" stroke="white" stroke-width="0.6" stroke-dasharray="2,1.5" /> -->
			<!-- </svg> -->
		</div>

		<div class="d-flex gap-2 flex-wrap justify-content-center mt-3">
			{#if !isStreaming}
				<IconButton icon="camera" caption="Otwórz aparat" onclick={startCamera} {disabled} size={5} />
			{:else}
				<IconButton icon="mode-landscape" caption="Zrob zdjęcie" onclick={capturePhoto} {disabled} size={5} />
				{#if isMobile}
					<IconButton icon="camera-rotate" caption="Przełącz aparat" onclick={switchCamera} {disabled} outline size={6} />
				{/if}
			{/if}
		</div>
	{:else}
		<!-- Captured photo preview -->
		<div class="ratio {ratioClass} rounded overflow-hidden bg-dark" style={ratioStyle}>
			<img src={capturedImageUrl} alt="Captured" class="w-100 h-100 object-fit-cover" />
		</div>

		<div class="d-flex gap-2 flex-wrap justify-content-center mt-3">
			<button class="btn btn-outline-secondary" onclick={retake}>Zrób ponownie</button>
		</div>
	{/if}

	<!-- hidden canvas used only for grabbing frames -->
	<canvas bind:this={canvasEl} class="d-none"></canvas>
</div>
