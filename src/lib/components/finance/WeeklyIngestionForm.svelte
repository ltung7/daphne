<script lang="ts">
	import type { WeeklyIngestionFormData } from '$lib/types/weeklyIngestation';
	import { newWeeklyIngestationDataSchema } from '$lib/assets/zodschemas/newweeklyIngestation.zod';
	import CardForm from '$lib/form/CardForm.svelte';
	import IconButton from '$lib/misc/IconButton.svelte';
	import SectionCard from '$lib/misc/SectionCard.svelte';
	import { fetchDrivers } from '$lib/nav/fetchData';
	import ClosableModal from '$lib/misc/ClosableModal.svelte';
	import dayjs from 'dayjs';
	import isoWeek from 'dayjs/plugin/isoWeek';
	import isoWeeksInYear from 'dayjs/plugin/isoWeeksInYear';
	import isLeapYear from 'dayjs/plugin/isLeapYear';

	dayjs.extend(isoWeek);
	dayjs.extend(isoWeeksInYear);
	dayjs.extend(isLeapYear);

	interface Props {
		item: WeeklyIngestionFormData;
		cleanItem?: WeeklyIngestionFormData;
		onResponse?: (res: any) => void;
		onReset?: () => void;
	}

	let { item = $bindable(), cleanItem: customCleanItem, onResponse, onReset }: Props = $props();

	let drivers: Record<string, string> = $state({});
	let showDriverModal = $state(false);

	const lastWeek = dayjs().subtract(1, 'week');
	let selectedYear = $state(lastWeek.isoWeekYear());
	let selectedWeek = $state(lastWeek.isoWeek());

	// Computed dates and periods
	let availableYears = $derived([ lastWeek.isoWeekYear() - 1, lastWeek.isoWeekYear(), lastWeek.isoWeekYear() + 1 ]);
	let maxWeeks = $derived(dayjs(`${selectedYear}-01-04`).isoWeeksInYear());

	let weekDate = $derived(dayjs(`${selectedYear}-01-04`).isoWeek(selectedWeek));
	let startDate = $derived(weekDate.startOf('isoWeek'));
	let endDate = $derived(weekDate.endOf('isoWeek'));
	let nextMonday = $derived(endDate.add(1, 'day'));

	let datesRangeText = $derived(`${startDate.format('DD.MM.YYYY')} - ${endDate.format('DD.MM.YYYY')}`);
	let calculatedPeriod = $derived(nextMonday.format('YYYY-MM'));

	$effect(() => {
		item.period = calculatedPeriod;
		item.week = `${selectedYear}-W${selectedWeek.toString().padStart(2, '0')}`;
	});

	// Derived list of drivers that have NOT been added yet
	let availableDrivers = $derived(
		Object.entries(drivers)
			.filter(([ id ]) => !item.driverEntries.some((entry) => entry.driverId === id))
			.map(([ id, name ]) => ({ id, name }))
	);

	const loadDrivers = async () => {
		if (Object.keys(drivers).length > 0) return;
		const fetchedDrivers = await fetchDrivers();
		const driverMap: Record<string, string> = {};
		fetchedDrivers.forEach((d) => {
			driverMap[d.id] = d.name;
		});
		drivers = driverMap;
	};

	const openDriverModal = async () => {
		await loadDrivers();
		showDriverModal = true;
	};

	let selectedDrivers: Record<string, boolean> = $state({});

	const toggleDriver = (driverId: string) => {
		selectedDrivers[driverId] = !selectedDrivers[driverId];
	};

	const addSelectedDrivers = () => {
		const newEntries = Object.entries(selectedDrivers)
			.filter(([ _, isSelected ]) => isSelected)
			.map(([ driverId ]) => ({
				driverId,
				grossEarnings: 0,
				platformCommission: 0
			}));

		item.driverEntries = [ ...item.driverEntries, ...newEntries ];
		selectedDrivers = {};
		showDriverModal = false;
	};

	const removeDriver = (index: number) => {
		item.driverEntries = item.driverEntries.filter((_, i) => i !== index);
	};

	const calculateBoltCut = (entry: any) => {
		const rate = item.boltRate ?? 0.25;
		return Math.round((Number(entry.grossEarnings) || 0) * rate * 100) / 100;
	};

	const calculateFleetCut = (entry: any) => {
		const rate = item.provisionRate ?? 0.50;
		return Math.round((Number(entry.grossEarnings) || 0) * rate * 100) / 100;
	};

	const calculateNet = (entry: any) => {
		const gross = Number(entry.grossEarnings) || 0;
		const boltCut = calculateBoltCut(entry);
		const fleetCut = calculateFleetCut(entry);
		return Math.round((gross - boltCut - fleetCut) * 100) / 100;
	};

	let totalGross = $derived(
		item.driverEntries.reduce((sum, e) => sum + (Number(e.grossEarnings) || 0), 0)
	);
	let totalBoltCut = $derived(
		item.driverEntries.reduce((sum, e) => sum + calculateBoltCut(e), 0)
	);
	let totalFleetCut = $derived(
		item.driverEntries.reduce((sum, e) => sum + calculateFleetCut(e), 0)
	);
	let totalNet = $derived(
		item.driverEntries.reduce((sum, e) => sum + calculateNet(e), 0)
	);

	const handleBeforeSubmit = (val: WeeklyIngestionFormData) => {
		const rate = val.boltRate ?? item.boltRate ?? 0.25;
		const updatedEntries = val.driverEntries.map((entry) => ({
			...entry,
			platformCommission: Math.round((Number(entry.grossEarnings) || 0) * rate * 100) / 100
		}));
		return {
			...val,
			driverEntries: updatedEntries
		};
	};

	let cleanItem = $derived(customCleanItem ?? {
		period: '',
		week: '',
		platform: 'bolt' as const,
		provisionRate: item.provisionRate,
		boltRate: item.boltRate ?? 0.25,
		driverEntries: []
	});

	// Helper for type-safe dotted error checking
	const getError = (errors: any, path: string) => errors[path] as string | undefined;
</script>

<SectionCard title="Informacje o rozliczeniu">
	<div class="row align-items-center">
		<div class="col-md-3 mb-3">
			<label class="form-label" for="year">Rok</label>
			<select class="form-select" id="year" bind:value={selectedYear}>
				{#each availableYears as year}
					<option value={year}>{year}</option>
				{/each}
			</select>
		</div>
		<div class="col-md-3 mb-3">
			<label class="form-label" for="week">Tydzień (W01-W53)</label>
			<div class="input-group">
				<span class="input-group-text bg-light">W</span>
				<input type="number" class="form-control ps-2" id="week" bind:value={selectedWeek} min="1" max={maxWeeks} />
			</div>
		</div>
		<div class="col-md-3 mb-3">
			<label class="form-label" for="provisionRate">Prowizja floty</label>
			<div class="input-group">
				<input type="number" step="0.01" min="0" max="1" class="form-control" id="provisionRate" bind:value={item.provisionRate} />
				<span class="input-group-text bg-light">{((item.provisionRate ?? 0) * 100).toFixed(0)}%</span>
			</div>
		</div>
		<div class="col-md-3 mb-3">
			<label class="form-label" for="boltRate">Prowizja Bolt</label>
			<div class="input-group">
				<input type="number" step="0.01" min="0" max="1" class="form-control" id="boltRate" bind:value={item.boltRate} />
				<span class="input-group-text bg-light">{((item.boltRate ?? 0) * 100).toFixed(0)}%</span>
			</div>
		</div>
		<div class="col-12 mb-2">
			<span class="form-label d-block text-muted small mb-1">Podsumowanie okresu</span>
			<div class="p-3 bg-light border rounded text-muted small d-flex flex-row align-items-center gap-4 flex-wrap">
				<div>
					<span class="text-secondary me-1">Okres rozliczeniowy:</span>
					<strong class="text-dark">{calculatedPeriod}</strong>
				</div>
				<div>
					<span class="text-secondary me-1">Zakres dat:</span>
					<strong class="text-dark">{datesRangeText}</strong>
				</div>
				<div>
					<span class="text-secondary me-1">Prowizja floty:</span>
					<strong class="text-primary">{((item.provisionRate ?? 0) * 100).toFixed(0)}%</strong>
				</div>
				<div>
					<span class="text-secondary me-1">Prowizja Bolt:</span>
					<strong class="text-dark">{((item.boltRate ?? 0) * 100).toFixed(0)}%</strong>
				</div>
				{#if item.driverEntries.length > 0}
					<div class="ms-md-auto">
						<span class="text-secondary me-1">Kierowcy:</span>
						<strong class="text-dark">{item.driverEntries.length}</strong>
					</div>
				{/if}
			</div>
		</div>
	</div>
</SectionCard>

<SectionCard title="Kierowcy" noCard>
	{#snippet cta()}
		<IconButton icon="plus" caption="Dodaj kierowcę" onclick={openDriverModal} size={6} outline class="mb-0" />
	{/snippet}

	<CardForm {item} {cleanItem} schema={newWeeklyIngestationDataSchema} {onResponse} {onReset} beforeSubmit={handleBeforeSubmit} name="payload">
		{#snippet children({ errors })}
			{#if errors['driverEntries']}
				<div class="text-danger mb-3">{errors['driverEntries']}</div>
			{/if}

			{#if item.driverEntries.length > 0}
				<div class="table-responsive">
					<table class="table align-middle table-hover">
						<thead class="table-light">
							<tr>
								<th>Kierowca</th>
								<th style="width: 170px">Przychód brutto</th>
								<th>Prowizja Bolt ({((item.boltRate ?? 0) * 100).toFixed(0)}%)</th>
								<th>Prowizja floty ({((item.provisionRate ?? 0) * 100).toFixed(0)}%)</th>
								<th>Netto dla kierowcy</th>
								<th class="text-end" style="width: 80px">Akcje</th>
							</tr>
						</thead>
						<tbody>
							{#each item.driverEntries as entry, index}
								<tr>
									<td>
										<div class="fw-bold">{drivers[entry.driverId] || entry.driverId}</div>
									</td>
									<td>
										<div class="input-group input-group-sm">
											<input 
												type="number" 
												step="0.01" 
												min="0"
												class="form-control {getError(errors, `driverEntries.${index}.grossEarnings`) ? 'is-invalid' : ''}" 
												bind:value={entry.grossEarnings}
												oninput={() => {
													entry.platformCommission = calculateBoltCut(entry);
												}}
											/>
											<span class="input-group-text">PLN</span>
										</div>
									</td>
									<td>
										<span class="text-muted">{calculateBoltCut(entry).toFixed(2)} PLN</span>
									</td>
									<td>
										<span class="text-muted">{calculateFleetCut(entry).toFixed(2)} PLN</span>
									</td>
									<td>
										<span class="text-success fw-bold">{calculateNet(entry).toFixed(2)} PLN</span>
									</td>
									<td class="text-end">
										<IconButton icon="trash" color="danger" class="mb-0" size={6} caption="Usuń" outline onclick={() => removeDriver(index)} />
									</td>
								</tr>
							{/each}
						</tbody>
						<tfoot class="table-light fw-bold">
							<tr>
								<td>Razem ({item.driverEntries.length})</td>
								<td>{totalGross.toFixed(2)} PLN</td>
								<td class="text-muted">{totalBoltCut.toFixed(2)} PLN</td>
								<td class="text-muted">{totalFleetCut.toFixed(2)} PLN</td>
								<td class="text-success">{totalNet.toFixed(2)} PLN</td>
								<td></td>
							</tr>
						</tfoot>
					</table>
				</div>
			{/if}

			{#if item.driverEntries.length === 0}
				<div class="text-center text-muted p-4">Brak wpisów. Kliknij "Dodaj kierowcę" aby zacząć.</div>
			{/if}
		{/snippet}
	</CardForm>
</SectionCard>

<ClosableModal bind:isOpen={showDriverModal} headerText="Wybierz kierowców" buttonCaption="Dodaj wybranych" onClick={addSelectedDrivers}>
	<div class="list-group">
		{#if availableDrivers.length === 0}
			<div class="list-group-item text-muted text-center p-4">
				Wszyscy kierowcy zostali już dodani.
			</div>
		{/if}
		{#each availableDrivers as driver}
			<button type="button" class="list-group-item list-group-item-action d-flex justify-content-between align-items-center" onclick={() => toggleDriver(driver.id)}>
				{driver.name}
				<div>
					{#if selectedDrivers[driver.id]}
						<IconButton icon="check" color="success" caption="Wybrano" class="mb-0" size={6} />
					{:else}
						<IconButton icon="plus" caption="Wybierz" class="mb-0" size={6} outline />
					{/if}
				</div>
			</button>
		{/each}
	</div>
</ClosableModal>
