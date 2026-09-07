<script lang="ts">
	import dashboard from '$lib/assets/guides/dashboard.png';
	import front from '$lib/assets/guides/front.png';
	import back from '$lib/assets/guides/back.png';
	import left from '$lib/assets/guides/left.png';
	import right from '$lib/assets/guides/right.png';
	import CameraCaptureSeries from './CameraCaptureSeries.svelte';

	interface CameraCaptureSeriesStep {
		src: string;
		step: number;
		type: Vehicle.ImageInspectionCategory;
		caption: string;
	}

	const steps: CameraCaptureSeriesStep[] = [
		{ src: dashboard, step: 1, type: 'photo_dashboard', caption: 'Panel rozdzielczy' },
		{ src: left, step: 2, type: 'photo_left_side', caption: 'Lewa strona' },
		{ src: front, step: 3, type: 'photo_front', caption: 'Przód' },
		{ src: right, step: 4, type: 'photo_right_side', caption: 'Prawa strona' },
		{ src: back, step: 5, type: 'photo_rear', caption: 'Tył' }
	];

	let { onfinished }: { onfinished?: (progress: Record<Vehicle.ImageInspectionCategory, string>) => void } = $props();
</script>
<CameraCaptureSeries {onfinished} {steps} />