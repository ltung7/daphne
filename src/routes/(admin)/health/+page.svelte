<script lang="ts">
	import { onMount } from 'svelte';
	import PageTitle from '$lib/misc/PageTitle.svelte';
	import Spinner from '$lib/misc/Spinner.svelte';
	import IconButton from '$lib/misc/IconButton.svelte';
	import IssueItem from '$lib/components/issues/IssueItem.svelte';
	import { internal } from '$lib/nav/internal';
	import { addToast } from '$lib/toast';
	import IconLink from '$lib/misc/IconLink.svelte';

	let healthData = $state<HealthCheck.HealthCheckResult>({ issues: [], summary: { critical: 0, warning: 0, info: 0 } });
	let loading = $state(true);
	let checking = $state(false);

	async function loadHealthData() {
		loading = true;
		try {
			const data = await internal.getApi();
			if (data && data.success) {
				healthData = { issues: data.issues ?? [], summary: data.summary ?? { critical: 0, warning: 0, info: 0 } };
			}
		} catch (err) {
			console.error('Failed to load health data:', err);
			addToast('Nie udało się załadować danych zdrowia floty', 'error');
		} finally {
			loading = false;
		}
	}

	async function triggerHealthCheck() {
		if (checking) return;
		checking = true;
		try {
			const data = await internal.postApi({});
			if (data && data.success && data.result) {
				healthData = data.result;
				addToast('Sprawdzenie zdrowia zakończone', 'success');
			}
		} catch (err) {
			console.error('Failed to trigger health check:', err);
			addToast('Nie udało się uruchomić sprawdzenia zdrowia', 'error');
		} finally {
			checking = false;
		}
	}

	onMount(loadHealthData);
</script>

<PageTitle title="Zdrowie floty" subtitle="Status pojazdów i kierowców">
	<div class="d-flex gap-2">
		<IconButton icon="check-circle" caption="Sprawdź teraz" color="primary" onclick={triggerHealthCheck} disabled={checking || loading} size={5} />
		<IconLink icon="users" caption="Odbiorcy" outline href="/health/matrix" size={5} class="mb-0" />
	</div>
</PageTitle>

{#if loading}
	<div class="text-center py-5">
		<Spinner />
		<p class="text-muted mt-2">Ładowanie danych zdrowia floty...</p>
	</div>
{:else}
	<div class="row g-3 mb-4">
		<div class="col-12 col-md-4">
			<div class="card bg-danger-subtle border-danger h-100">
				<div class="card-body text-center">
					<div class="display-4 fw-bold text-danger">{healthData.summary.critical}</div>
					<div class="text-muted small">Krytyczne</div>
				</div>
			</div>
		</div>
		<div class="col-12 col-md-4">
			<div class="card bg-warning-subtle border-warning h-100">
				<div class="card-body text-center">
					<div class="display-4 fw-bold text-warning">{healthData.summary.warning}</div>
					<div class="text-muted small">Ostrzeżenia</div>
				</div>
			</div>
		</div>
		<div class="col-12 col-md-4">
			<div class="card bg-info-subtle border-info h-100">
				<div class="card-body text-center">
					<div class="display-4 fw-bold text-info">{healthData.summary.info}</div>
					<div class="text-muted small">Informacje</div>
				</div>
			</div>
		</div>
	</div>

	<div class="card">
		<div class="card-header d-flex justify-content-between align-items-center">
			<h5 class="mb-0">Wykryte problemy</h5>
			<span class="badge bg-primary rounded-pill">{healthData.issues.length}</span>
		</div>
		<div class="card-body px-0">
			{#if healthData.issues.length === 0}
				<div class="text-center py-4 text-muted">
					Nie wykryto problemów
				</div>
			{:else}
				<ul class="list-group list-group-flush">
					{#each healthData.issues as problem}
						<IssueItem {problem} />
					{/each}
				</ul>
			{/if}
		</div>
	</div>
{/if}