<script lang="ts">
	import type { PageProps } from './$types';
	import ExpandableSection from '$lib/misc/ExpandableSection.svelte';
	import { m } from '$lib/paraglide/messages.js';
	import { formatCurrency } from '$lib/utils/numberFormatter';
	import ExpirationDateLocalized from '$lib/localized/ExpirationDateLocalized.svelte';
	import DriverVehicleDocumentLocalized from '$lib/localized/DriverVehicleDocumentLocalized.svelte';
	import { calculateDaysBefore } from '$lib/utils/dates';
	import { EXPIRATION_THRESHOLD } from '$lib/assets/constants';
	import IconButton from '$lib/misc/IconButton.svelte';
	import { Offcanvas } from '@sveltestrap/sveltestrap';
	import NewInspectionLocalized from '$lib/components/inspection/localized/NewInspectionLocalized.svelte';

	let { data }: PageProps = $props();

	let inspectionOpen: boolean = $state(false);
	const toggleInspection = () => (inspectionOpen = !inspectionOpen);

	const driverDates = $derived([ ...data.driver.drivingLicenses.map((l) => l.expirationDate), data.driver.taxiAuthorization?.expirationDate ].filter(Boolean)) as string[];

	const vehicleDates = $derived([ data.vehicle?.insuranceExpiration, data.vehicle?.technicalExpiration ].filter(Boolean)) as string[];

	const hasDateBeforeThreshold = (dates: string[]) => Math.min(...dates.map(calculateDaysBefore)) <= EXPIRATION_THRESHOLD;
	const driverExpiringSoon = $derived(hasDateBeforeThreshold(driverDates));
	const vehicleExpiringSoon = $derived(hasDateBeforeThreshold(vehicleDates));
</script>

<ExpandableSection caption={m.driver_data_title()} icon="user" expanded={driverExpiringSoon}>
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

<ExpandableSection caption={m.vehicle_title()} icon="car" expanded={vehicleExpiringSoon}>
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

<ExpandableSection caption={m.inspection_title()} icon="assessment" expanded={vehicleExpiringSoon}>
	{#if data.vehicle}
		<div class="flex-center flex-column">
			<p class="text-muted small mb-3 text-center">{m.inspection_needed_text()}</p>
			<IconButton icon="assessment" caption={m.inspection_start()} onclick={() => (inspectionOpen = true)} size={6} />
		</div>
	{:else}
		<div class="text-center py-3 text-muted">{m.inspection_no_vehicle()}</div>
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
		<div class="stat-value fs-2 fw-bold text-success">{formatCurrency(data.balance ? data.balance.runningBalance : 0)}</div>
	</div>
</ExpandableSection>

<Offcanvas toggle={toggleInspection} bind:isOpen={inspectionOpen} placement="bottom" header={m.inspection_title()} style="height: 95vh;">
	<NewInspectionLocalized vehicle={data.vehicle!} />
</Offcanvas>
