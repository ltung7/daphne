<script lang="ts">
	import IconButton from '$lib/misc/IconButton.svelte';
	import PageTitle from '$lib/misc/PageTitle.svelte';
	import Spinner from '$lib/misc/Spinner.svelte';
	import ClosableModal from '$lib/misc/ClosableModal.svelte';
	import { onMount } from 'svelte';
	import { internal, confirmSuccess } from '$lib/nav/internal';
	import TooltipSquareIconButton from '$lib/misc/TooltipSquareIconButton.svelte';

	let matrix = $state<HealthCheck.HealthCheckRecipientMap | null>(null);
	let loading = $state(true);
	let saving = $state(false);
	
	let isModalOpen = $state(false);
	let selectedProblem = $state<HealthCheck.HealthCheckProblem | null>(null);
	let users = $state<App.User[]>([]);
	let loadingUsers = $state(false);

	const problems: { key: HealthCheck.HealthCheckProblem; label: string }[] = [
		{ key: 'insurance_expiring', label: 'Wygasa ubezpieczenie' },
		{ key: 'technical_expiring', label: 'Wygasa przegląd techniczny' },
		{ key: 'license_expiring', label: 'Wygasa prawo jazdy' },
		{ key: 'taxi_authorization_expiring', label: 'Wygasa identyfikator taxi' }
	];

	async function loadMatrix() {
		loading = true;
		const data = await internal.getApi();
		matrix = data.matrix;
		loading = false;
	}

	async function saveMatrix() {
		if (!matrix || saving) return;
		saving = true;
		try {
			const data = await confirmSuccess(internal.postApi(matrix));
			matrix = data.matrix;
		} finally {
			saving = false;
		}
	}

	async function openAddRecipientModal(problem: HealthCheck.HealthCheckProblem) {
		selectedProblem = problem;
		isModalOpen = true;
		if (users.length === 0 && !loadingUsers) {
			loadingUsers = true;
			const data = await internal.get('/users/api');
			if (data && data.users) {
				users = data.users;
			}
			loadingUsers = false;
		}
	}

	async function selectUserAsRecipient(user: App.User) {
		if (!matrix || !selectedProblem) return;
		matrix[selectedProblem] = [
			...matrix[selectedProblem],
			{
				id: user.id || crypto.randomUUID(),
				name: user.name || ''
			}
		];
		isModalOpen = false;
		selectedProblem = null;
		await saveMatrix();
	}

	async function removeRecipient(problem: HealthCheck.HealthCheckProblem, index: number) {
		if (!matrix) return;
		matrix[problem] = matrix[problem].filter((_: App.BaseContact, i: number) => i !== index);
		await saveMatrix();
	}

	onMount(() => {
		loadMatrix();
	});
</script>

<PageTitle title="Odbiorcy powiadomień" subtitle="Matryca powiadomień systemowych" />

{#if loading}
	<Spinner />
{:else if matrix}
	<div class="card card-body">
		<div class="table-responsive">
			<table class="table table-hover table-bordered align-middle mb-0">
				<thead class="table-light">
					<tr>
						<th style="width: 270px">Problem</th>
						<th>Odbiorcy</th>
						<th style="width: 140px">Dodaj</th>
					</tr>
				</thead>
				<tbody>
					{#each problems as { key, label }}
						<tr>
							<td class="fw-bold text-dark">{label}</td>
							<td class="text-dark small">
								{#if matrix[key].length === 0}
									<div class="text-muted fst-italic">Brak odbiorców</div>
								{:else}
									{#each matrix[key] as recipient, i}
										<div class="d-flex align-items-center justify-content-between rounded">
											<span class="fw-medium">{recipient.name}</span>
											<TooltipSquareIconButton icon="cross-circle" hoverText="Usuń" onClick={() => removeRecipient(key, i)} size={6} color="dark" />
										</div>
									{/each}
								{/if}
							</td>
							<td class="py-1">
								<IconButton outline onclick={() => openAddRecipientModal(key)} caption="Dodaj odbiorcę" size={6} icon="add" />
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	</div>
{/if}

<ClosableModal bind:isOpen={isModalOpen} headerText="Wybierz użytkownika" size="lg">
	{#if loadingUsers}
		<Spinner />
	{:else}
		<div class="list-group">
			{#each users as user}
				{@const isAdded = matrix && selectedProblem ? matrix[selectedProblem].some(r => r.id === user.id) : false}
				<button class="list-group-item list-group-item-action d-flex justify-content-between align-items-center" class:bg-light={isAdded} disabled={isAdded} onclick={() => !isAdded && selectUserAsRecipient(user)}>
					<div>
						<strong>{user.name}</strong>
						<br />
						<small class="text-muted">{user.email}</small>
					</div>
					{#if isAdded}
						<span class="badge bg-secondary">Dodano</span>
					{:else}
						<IconButton icon="add" size={6} outline caption="Wybierz" />
					{/if}
				</button>
			{/each}
			{#if users.length === 0}
				<div class="p-3 text-center text-muted">
					Brak użytkowników
				</div>
			{/if}
		</div>
	{/if}
</ClosableModal>
