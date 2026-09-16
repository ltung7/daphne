<script lang="ts">
	import { onMount } from 'svelte';
	import DashboardNumberCard from '$lib/misc/DashboardNumberCard.svelte';
	import PageTitle from '$lib/misc/PageTitle.svelte';
	import { internal } from '$lib/nav/internal';
	import IconButton from '$lib/misc/IconButton.svelte';
	import IssueItem from '$lib/components/issues/IssueItem.svelte';

	interface StatsData {
		drivers: {
			total: number;
			active: number;
			inactive: number;
			onLeave: number;
			pending: number;
		};
		vehicles: {
			total: number;
			available: number;
			assigned: number;
			broken: number;
			maintenance: number;
			precheck: number;
		};
		financial: {
			totalEarnings: number;
			totalBalance: number;
			totalTrips: number;
		};
	}

	let stats: StatsData = $state({
		drivers: { total: 0, active: 0, inactive: 0, onLeave: 0, pending: 0 },
		vehicles: { total: 0, available: 0, assigned: 0, broken: 0, maintenance: 0, precheck: 0 },
		financial: { totalEarnings: 0, totalBalance: 0, totalTrips: 0 }
	});

	let problems: HealthCheck.HealthCheckResult = $state({ issues: [], summary: { critical: 0, info: 0, warning: 0 } });
	let loading = $state(true);

	const loadData = async () => {
		try {
			const response = await internal.get('/panel/api');
			if (response.success) {
				stats = response.stats;
				problems = response.problems;
			}
		} catch (err) {
			console.error('Failed to load panel data:', err);
		} finally {
			loading = false;
		}
	};

	onMount(loadData);
</script>

<PageTitle title="Panel" subtitle="Przegląd floty i kierowców">
	<IconButton icon="refresh" caption="Odśwież" onclick={loadData} />
</PageTitle>

{#if loading}
	<div class="text-center py-5">
		<div class="spinner-border text-primary" role="status">
			<span class="visually-hidden">Ładowanie...</span>
		</div>
	</div>
{:else}
	<div class="row g-3 mb-4">
		<div class="col-12 col-md-6 col-xl-3">
			<DashboardNumberCard
				value={stats.drivers.total}
				caption="Wszyscy kierowcy"
				icon="users"
				color="primary"
				prefix=""
				suffix=""
			/>
		</div>
		<div class="col-12 col-md-6 col-xl-3">
			<DashboardNumberCard
				value={stats.drivers.active}
				caption="Aktywni kierowcy"
				icon="user-check"
				color="success"
				prefix=""
				suffix=""
			/>
		</div>
		<div class="col-12 col-md-6 col-xl-3">
			<DashboardNumberCard
				value={stats.drivers.pending}
				caption="Oczekujący"
				icon="user-time"
				color="warning"
				prefix=""
				suffix=""
			/>
		</div>
		<div class="col-12 col-md-6 col-xl-3">
			<DashboardNumberCard
				value={stats.drivers.inactive + stats.drivers.onLeave}
				caption="Nieaktywni kierowcy"
				icon="user-forbidden-alt"
				color="secondary"
				prefix=""
				suffix=""
			/>
		</div>
	</div>

	<div class="row g-3 mb-4">
		<div class="col-12 col-md-6 col-xl-3">
			<DashboardNumberCard
				value={stats.vehicles.total}
				caption="Wszystkie pojazdy"
				icon="cars"
				color="primary"
				prefix=""
				suffix=""
			/>
		</div>
		<div class="col-12 col-md-6 col-xl-3">
			<DashboardNumberCard
				value={stats.vehicles.available}
				caption="Dostępne pojazdy"
				icon="garage-car"
				color="success"
				prefix=""
				suffix=""
			/>
		</div>
		<div class="col-12 col-md-6 col-xl-3">
			<DashboardNumberCard
				value={stats.vehicles.assigned}
				caption="Przypisane pojazdy"
				icon="car-journey"
				color="info"
				prefix=""
				suffix=""
			/>
		</div>
		<div class="col-12 col-md-6 col-xl-3">
			<DashboardNumberCard
				value={stats.vehicles.broken + stats.vehicles.maintenance}
				caption="Unieruchomione"
				icon="car-mechanic"
				color="danger"
				prefix=""
				suffix=""
			/>
		</div>
	</div>

	<div class="row">
		<div class="col-12">
			<div class="card">
				<div class="card-header d-flex justify-content-between align-items-center">
					<h5 class="mb-0">Problemy i alerty</h5>
					<span class="badge bg-primary rounded-pill">{problems.issues.length}</span>
				</div>
				<div class="card-body px-0">
					{#if problems.issues.length === 0}
						<div class="text-center py-4 text-muted">
							Brak wykrytych problemów
						</div>
					{:else}
						<ul class="list-group list-group-flush">
							{#each problems.issues as problem}
								<IssueItem {problem} />
							{/each}
						</ul>
					{/if}
				</div>
			</div>
		</div>
	</div>
{/if}