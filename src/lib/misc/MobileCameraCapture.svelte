<script lang="ts">
	import { onDestroy, onMount } from 'svelte';
	import { m } from '$lib/paraglide/messages.js';
	import IconButton from '$lib/misc/IconButton.svelte';

	type CommonProps<T> = {
		oncapture?: (image: T) => void;
		onaccept?: (image: T) => void;
		onreset?: () => void;
		onclose?: () => void;
		overlay?: string;
		overlayText?: string;
		asPng?: boolean;
	};

	type ComponentProps = (CommonProps<ArrayBuffer> & { asArrayBuffer: true }) | (CommonProps<string> & { asArrayBuffer?: false });

	let { oncapture, onaccept, onreset, onclose, overlay, overlayText, asPng = false, asArrayBuffer }: ComponentProps = $props();

	let videoEl = $state<HTMLVideoElement | null>(null);
	let canvasEl = $state<HTMLCanvasElement | null>(null);
	let stream: MediaStream | null = null;
	let capturedImage = $state<string | ArrayBuffer | null>(null);
	let error = $state<string>('');
	let isStreaming = $state<boolean>(false);
	let facingMode = $state<'user' | 'environment'>('user');
	let disabled = $state<boolean>(true);
	let capturedImageUrl = $state<string | null>(null);

	async function startCamera(): Promise<void> {
		disabled = true;
		error = '';
		stopCamera();

		try {
			stream = await navigator.mediaDevices.getUserMedia({
				video: {
					facingMode,
					width: { ideal: 1920 },
					height: { ideal: 1440 }
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
				error = m.camera_permission_denied();
			} else if (e.name === 'NotFoundError') {
				error = m.camera_not_found();
			} else {
				error = m.camera_access_error({ message: e.message });
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

			const dataUrl = canvasEl.toDataURL(asPng ? 'image/png' : 'image/jpeg', 0.8);
			capturedImageUrl = dataUrl;

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

	export function retake(): void {
		capturedImage = null;
		capturedImageUrl = null;
		onreset?.();
		startCamera();
	}

	const handleAccept = () => {
		if (capturedImage) {
			// @ts-expect-error Types mix
			onaccept?.(capturedImage);
		}
	};

	const handleClose = () => {
		stopCamera();
		onclose?.();
	};

	onDestroy(() => {
		stopCamera();
	});

	onMount(() => {
		setTimeout(() => {
			startCamera();
		}, 100);
	});
</script>

<div class="position-fixed top-0 start-0 w-100 h-100 d-flex flex-column">
	{#if error}
		<div class="position-fixed top-0 start-0 end-0 m-3 z-index-1051">
			<div class="alert alert-danger" role="alert">{error}</div>
		</div>
	{/if}

	<!-- Video/Image area: 4:3 aspect ratio, height = 100vh - 50px -->
	<div class="d-flex justify-content-center align-items-center" style="height: calc(100vh - 50px); max-height: calc(100vh - 50px);">
		<div class="position-relative" style="aspect-ratio: 4/3; width: 100%; max-width: 100%;">
			{#if !capturedImage}
				<!-- Video container - 4:3 locked -->
				<video bind:this={videoEl} class="w-100 h-100 object-fit-cover" playsinline muted></video>
			{:else}
				<!-- Captured image preview - 4:3 locked -->
				<img src={capturedImageUrl} alt="Captured" class="w-100 h-100 object-fit-cover" />
			{/if}
			{#if overlayText}
				<span class="video-overlay">{overlayText}</span>
			{/if}
			{#if overlay}
				<img src={overlay} alt="Overlay guide" class="position-absolute top-0 start-0 w-100 h-100 opacity-7" />
			{/if}
		</div>
	</div>

	<!-- Bottom controls - fixed 50px height -->
	<div class="position-relative p-1 border-top border-dark bg-white" style="height: 50px; flex-shrink: 0;">
		<div class="d-flex justify-content-center gap-3 flex-wrap h-100 align-items-center">
			{#if !capturedImage}
				{#if !isStreaming}
					<IconButton icon="camera" caption={m.camera_open()} onclick={startCamera} {disabled} size={6} />
				{:else}
					<IconButton icon="camera" caption={m.camera_take_photo()} onclick={capturePhoto} {disabled} size={6} />
					<IconButton icon="camera-rotate" caption={m.camera_switch()} onclick={switchCamera} {disabled} color="dark" size={6} />
				{/if}
			{:else}
				<IconButton icon="check-circle" onclick={handleAccept} caption={m.camera_accept()} size={6} />
				<IconButton icon="redo" onclick={retake} caption={m.camera_retake()} color="dark" size={6} />
			{/if}
			<IconButton icon="cross-circle" color="secondary" caption={m.camera_close()} size={6} onclick={handleClose} />
		</div>
	</div>

	<canvas bind:this={canvasEl} class="d-none"></canvas>
</div>