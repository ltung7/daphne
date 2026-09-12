<script lang="ts">
	import type { PageProps } from './$types';
	import ExpandableSection from '$lib/misc/ExpandableSection.svelte';
	import LanguageSelector from '$lib/misc/LanguageSelector.svelte';
	import UIcon from '$lib/misc/UIcon.svelte';
	import { m } from '$lib/paraglide/messages.js';

	let { data }: PageProps = $props();
</script>

<div class="driver-app">
	<header class="driver-header">
		<div class="header-top d-flex align-items-center justify-content-between flex-wrap gap-2">
			<h1 class="m-0 fs-4">{m.driver_panel_title()}</h1>
			<LanguageSelector />
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
			<ExpandableSection caption={m.vehicle_title()} icon="car" expanded={true}>
				{#if data.vehicle}
					<dl class="row mb-0">
						<dt class="col-sm-4 text-muted small">{m.vehicle_registration()}</dt>
						<dd class="col-sm-8 fw-medium mb-2">{data.vehicle.registrationNumber}</dd>
						<dt class="col-sm-4 text-muted small">{m.vehicle_make_model()}</dt>
						<dd class="col-sm-8 fw-medium mb-2">{data.vehicle.modelMake}</dd>
						<dt class="col-sm-4 text-muted small">VIN</dt>
						<dd class="col-sm-8 fw-medium mb-2">{data.vehicle.vin || m.vehicle_vin_na()}</dd>
						<dt class="col-sm-4 text-muted small">{m.vehicle_first_registration()}</dt>
						<dd class="col-sm-8 fw-medium mb-2">{data.vehicle.firstRegistrationDate}</dd>
						<dt class="col-sm-4 text-muted small">{m.vehicle_insurance()}</dt>
						<dd class="col-sm-8 fw-medium mb-2">{data.vehicle.insuranceExpiration}</dd>
						<dt class="col-sm-4 text-muted small">{m.vehicle_technical_inspection()}</dt>
						<dd class="col-sm-8 fw-medium mb-0">{data.vehicle.technicalExpiration}</dd>
					</dl>
				{:else}
					<div class="text-center py-3 text-muted">{m.no_vehicle_assigned()}</div>
				{/if}
			</ExpandableSection>

			<ExpandableSection caption={m.documents_title()} icon="document">
				<div class="d-flex flex-column gap-2">
					<button class="btn btn-outline-secondary btn-sm d-flex align-items-center justify-content-between" type="button">
						<span>{m.document_drivers_license()}</span>
						<UIcon name="check-circle" color="success" size={3} />
					</button>
					<button class="btn btn-outline-secondary btn-sm d-flex align-items-center justify-content-between" type="button">
						<span>{m.document_registration_certificate()}</span>
						<UIcon name="check-circle" color="success" size={3} />
					</button>
					<button class="btn btn-outline-secondary btn-sm d-flex align-items-center justify-content-between" type="button">
						<span>{m.document_oc_policy()}</span>
						<UIcon name="check-circle" color="success" size={3} />
					</button>
					<button class="btn btn-outline-secondary btn-sm d-flex align-items-center justify-content-between" type="button">
						<span>{m.document_technical_inspection()}</span>
						<UIcon name="clock" color="warning" size={3} />
					</button>
				</div>
			</ExpandableSection>

			<ExpandableSection caption={m.trip_history_title()}>
				<div class="text-center py-4 text-muted">{m.trip_history_coming_soon()}</div>
			</ExpandableSection>

			<ExpandableSection caption={m.settlements_title()}>
				<div class="text-center py-4 text-muted">{m.settlements_coming_soon()}</div>
			</ExpandableSection>

			<ExpandableSection caption={m.earnings_this_week()} expanded={true}>
				<div class="stat-card p-4 text-center">
					<div class="stat-value fs-2 fw-bold text-success">0,00 PLN</div>
					<div class="stat-label text-muted small">{m.earnings_after_sync()}</div>
				</div>
			</ExpandableSection>

			<ExpandableSection caption={m.settings_title()} icon="settings">
				<div class="d-flex flex-column gap-2">
					<button class="btn btn-outline-secondary btn-sm d-flex align-items-center justify-content-between" type="button">
						<span>{m.settings_notifications()}</span>
						<UIcon name="bell" size={3} />
					</button>
					<button class="btn btn-outline-secondary btn-sm d-flex align-items-center justify-content-between" type="button">
						<span>{m.settings_payment_methods()}</span>
						<UIcon name="credit-card" size={3} />
					</button>
					<button class="btn btn-outline-secondary btn-sm d-flex align-items-center justify-content-between" type="button">
						<span>{m.settings_privacy()}</span>
						<UIcon name="shield" size={3} />
					</button>
					<button class="btn btn-outline-secondary btn-sm d-flex align-items-center justify-content-between text-danger" type="button">
						<span>{m.settings_logout()}</span>
						<UIcon name="log-out" size={3} />
					</button>
				</div>
			</ExpandableSection>
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
