<script lang="ts">
	interface Props {
		/** The current value of the gauge */
		value?: number;
		/** The maximum value the gauge can reach */
		max?: number;
		/** The text label displayed in the center */
		label?: string;
		/** The width of the component in pixels */
		size?: number;
	}

	let { 
		value = 0, 
		max = 100,
		label = 'POWER',
		size = 300
	}: Props = $props();

	let clampedValue = $derived(Math.max(0, Math.min(value, max)));
	let percent = $derived(max > 0 ? clampedValue / max : 0);
	
	const radius = 70;
	const pathLength = Math.PI * radius; // ~219.91
	
	let strokeOffset = $derived(pathLength - (percent * pathLength));
	let needleAngle = $derived(-90 + (percent * 180));
	
	// Hooking into Bootstrap's native CSS color variables
	let displayColor = $derived(
		percent > 0.8 ? 'var(--bs-danger)' : 
		percent > 0.5 ? 'var(--bs-warning)' : 
		'var(--bs-success)'
	);
</script>

<!-- Replaced custom container CSS with Bootstrap layout, padding, background, and border-radius utilities -->
<div 
	class="d-inline-flex justify-content-center align-items-center p-4 bg-dark border-radius-xl shadow" 
	style="width: {size}px; max-width: 100%;"
>
	<!-- Replaced custom CSS with w-100, d-block, and overflow-visible -->
	<svg viewBox="0 0 200 130" class="w-100 d-block overflow-visible">
		<defs>
			<linearGradient id="speedGrad" x1="0%" y1="0%" x2="100%" y2="0%">
				<!-- Using Bootstrap's theme colors -->
				<stop offset="0%" stop-color="var(--bs-success, #198754)" />
				<stop offset="50%" stop-color="var(--bs-warning, #ffc107)" />
				<stop offset="100%" stop-color="var(--bs-danger, #dc3545)" />
			</linearGradient>
			
			<filter id="glow">
				<feGaussianBlur stdDeviation="2" result="coloredBlur"/>
				<feMerge>
					<feMergeNode in="coloredBlur"/>
					<feMergeNode in="SourceGraphic"/>
				</feMerge>
			</filter>
		</defs>

		<!-- Tick Marks using Bootstrap gray variables -->
		{#each Array(21) as _, i}
			{@const angle = -90 + (i * 9)}
			{@const isMajor = i % 2 === 0}
			<line 
				x1="100" y1={isMajor ? "12" : "18"} 
				x2="100" y2="24" 
				stroke={isMajor ? "var(--bs-gray-500, #adb5bd)" : "var(--bs-gray-700, #495057)"} 
				stroke-width={isMajor ? "2" : "1"}
				transform="rotate({angle}, 100, 100)"
			/>
		{/each}

		<!-- Background Track -->
		<path 
			d="M 30 100 A {radius} {radius} 0 0 1 170 100" 
			fill="none" 
			stroke="var(--bs-gray-800, #343a40)" 
			stroke-width="12" 
			stroke-linecap="round"
		/>

		<!-- Foreground Animated Track -->
		<path 
			d="M 30 100 A {radius} {radius} 0 0 1 170 100" 
			fill="none" 
			stroke="url(#speedGrad)" 
			stroke-width="12" 
			stroke-linecap="round"
			stroke-dasharray={pathLength}
			stroke-dashoffset={strokeOffset}
			class="track-fill"
			filter="url(#glow)"
		/>

		<!-- Needle -->
		<g transform="rotate({needleAngle}, 100, 100)" class="needle-group">
			<polygon points="97,100 103,100 100,28" fill="var(--bs-danger, #dc3545)" />
			<circle cx="100" cy="100" r="7" fill="var(--bs-dark, #212529)" stroke="var(--bs-gray-600, #6c757d)" stroke-width="2"/>
			<circle cx="100" cy="100" r="3" fill="var(--bs-danger, #dc3545)" />
		</g>

		<!-- Digital Readout using Bootstrap typography classes: font-monospace and fw-bold -->
		<text 
			x="100" y="125" 
			text-anchor="middle" 
			font-size="24" 
			class="font-monospace fw-bold" 
			fill={displayColor} 
			style="transition: fill 0.3s ease;"
		>
			{Math.round(percent * 100)}<tspan font-size="14" fill="var(--bs-gray-500, #adb5bd)">%</tspan>
		</text>
		
		<!-- Label using Bootstrap's fw-bold -->
		<text 
			x="100" y="90" 
			text-anchor="middle" 
			font-size="8" 
			class="fw-bold" 
			fill="var(--bs-secondary, #6c757d)" 
			style="letter-spacing: 0.1em;"
		>
			{label.toUpperCase()}
		</text>
	</svg>
</div>

<style>
	/* All layout and typography CSS was replaced by Bootstrap 5 utility classes. */
	/* We only keep the required SVG transition rules here. */
	
	.track-fill {
		transition: stroke-dashoffset 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
	}

	.needle-group {
		transition: transform 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
	}
</style>