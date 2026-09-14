<script lang="ts">
	import { getLocale } from "$lib/paraglide/runtime";
	import type { PageProps } from './$types';
	import ExpandableSection from '$lib/misc/ExpandableSection.svelte';
	import LanguageSelector from '$lib/misc/LanguageSelector.svelte';
	import { m } from '$lib/paraglide/messages.js';
	import { formatCurrency } from '$lib/utils/numberFormatter';
	import ExpirationDateLocalized from '$lib/localized/ExpirationDateLocalized.svelte';
	import DriverVehicleDocumentLocalized from '$lib/localized/DriverVehicleDocumentLocalized.svelte';

	let localeState = $state(getLocale())
	let { data }: PageProps = $props();
</script>

<svelte:head>
	<title>{m.driver_panel_title()}</title>
</svelte:head>

{#key localeState}
	<div class="driver-app">
		<header class="driver-header">
			<div class="header-top d-flex align-items-center justify-content-between flex-wrap gap-2">
				<h1 class="m-0 fs-4">{m.driver_panel_title()}</h1>
				<LanguageSelector bind:localeState />
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
				<ExpandableSection caption={m.driver_data_title()} icon="user" expanded={true}>
					<dl class="row mb-0">
						<dt class="col-sm-4 text-muted small">{m.driver_name()}</dt>
						<dd class="col-sm-8 fw-medium mb-2 text-dark">{data.driver.name}</dd>
						{#each data.driver.drivingLicenses as license}
							<dt class="col-sm-4 text-muted small">{m.driving_license_category({ category: license.category })}</dt>
							<dd class="col-sm-8 fw-medium mb-2 text-dark">
								<ExpirationDateLocalized date={license.expirationDate} />
							</dd>
						{/each}
						{#if data.driver.taxiAuthorization}
							<dt class="col-sm-4 text-muted small">{m.taxi_authorization()}</dt>
							<dd class="col-sm-8 fw-medium mb-0 text-dark">
								<ExpirationDateLocalized date={data.driver.taxiAuthorization.expirationDate} />
							</dd>
						{/if}
					</dl>
				</ExpandableSection>

				<ExpandableSection caption={m.vehicle_title()} icon="car" expanded={true}>
					{#if data.vehicle}
						<dl class="row mb-0">
							<dt class="col-sm-4 text-muted small">{m.vehicle_registration()}</dt>
							<dd class="col-sm-8 fw-medium mb-2 text-dark">{data.vehicle.registrationNumber}</dd>
							<dt class="col-sm-4 text-muted small">{m.vehicle_make_model()}</dt>
							<dd class="col-sm-8 fw-medium mb-2 text-dark">{data.vehicle.modelMake}</dd>
							<dt class="col-sm-4 text-muted small">{m.vehicle_insurance()}</dt>
							<dd class="col-sm-8 fw-medium mb-2 text-dark">
								<ExpirationDateLocalized date={data.vehicle.insuranceExpiration} />
							</dd>
							<dt class="col-sm-4 text-muted small">{m.vehicle_technical_inspection()}</dt>
							<dd class="col-sm-8 fw-medium mb-0 text-dark">
								<ExpirationDateLocalized date={data.vehicle.technicalExpiration} />
							</dd>
						</dl>
					{:else}
						<div class="text-center py-3 text-muted">{m.no_vehicle_assigned()}</div>
					{/if}
				</ExpandableSection>

				<ExpandableSection caption={m.documents_title()} icon="document">
					<ul class="list-group">
						{#each data.documents as doc}
							<DriverVehicleDocumentLocalized {doc} />
						{/each}
					</ul>
				</ExpandableSection>

				<ExpandableSection caption={m.balance()} expanded={true}>
					<div class="stat-card p-4 text-center">
						<div class="stat-value fs-2 fw-bold text-success">{formatCurrency(data.balance)}</div>
					</div>
				</ExpandableSection>
			</div>
		</main>
	</div>
{/key}

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

	.stat-card {
		background: white;
		border-radius: 0.5rem;
		border: 1px solid #e0e0e0;
		transition:
			box-shadow 0.2s,
			transform 0.2s;
	}

	.stat-card:hover {
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
		transform: translateY(-2px);
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
