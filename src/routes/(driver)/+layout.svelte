<script lang="ts">
	import type { LayoutProps } from './$types';
	import LanguageSelector from '$lib/misc/LanguageSelector.svelte';
	import { m } from '$lib/paraglide/messages.js';
	import { layoutState } from '$lib/nav/stores.svelte';
	import { untrack } from 'svelte';

	let { data, children }: LayoutProps = $props();
	if (untrack(() => data.locale)) layoutState.currentLocale = untrack(() => data.locale);
</script>

<svelte:head>
	<title>{m.driver_panel_title()}</title>
</svelte:head>

<div class="driver-app">
	<header class="driver-header">
		<div class="header-top d-flex align-items-center justify-content-between flex-wrap gap-2">
			{#key layoutState.currentLocale}
				<h1 class="m-0 fs-4">{m.driver_panel_title()}</h1>
				<LanguageSelector />
			{/key}
		</div>
		<div class="driver-info d-flex align-items-center flex-wrap gap-2 mt-2">
			<span class="driver-name fw-medium">{data.driver.name}</span>
			{#if data.vehicle}
				<span class="vehicle-badge">{data.vehicle.registrationNumber} - {data.vehicle.modelMake}</span>
			{:else}
				<span class="no-vehicle">{m.no_vehicle_assigned()}</span>
			{/if}
		</div>
	</header>

	<main class="driver-content">
		<div class="container-fluid px-0 px-md-4">
			{#key layoutState.currentLocale}
				{@render children()}
			{/key}
		</div>
	</main>
</div>

<style>
	.driver-app {
		min-height: 100vh;
		background: #f5f5f5;
	}

	.driver-header {
		background: white;
		padding: 1rem 1.5rem;
		border-bottom: 1px solid #e0e0e0;
		position: sticky;
		top: 0;
		z-index: 100;
	}

	.driver-name {
		font-size: 1rem;
	}

	.vehicle-badge {
		background: #e3f2fd;
		color: #1976d2;
		padding: 0.25rem 0.75rem;
		border-radius: 9999px;
		font-weight: 500;
		font-size: 0.85rem;
		white-space: nowrap;
	}

	.no-vehicle {
		color: #f44336;
		font-weight: 500;
		font-size: 0.85rem;
	}

	.driver-content {
		padding: 1.5rem 1rem;
	}

	@media (max-width: 575.98px) {
		.driver-header {
			padding: 1rem;
		}

		.driver-content {
			padding: 1rem 0.75rem;
		}
	}
</style>
