<script lang="ts">
	import IconButton from '$lib/misc/IconButton.svelte';
	import { internal } from '$lib/nav/internal';

	interface Props {
		vehicle: Vehicle.Vehicle;
		actions: Vehicle.Status[];
		onstatuschanged?: (status: Vehicle.Status) => void;
	}

	let { vehicle, actions, onstatuschanged }: Props = $props();

	let loadingStatus = $state<Vehicle.Status | null>(null);

	const statusConfig: Record<Vehicle.Status, { caption: string; icon: string; color?: string }> = {
		precheck: { caption: 'Wycofaj do weryfikacji', icon: 'clipboard-check', color: 'secondary' },
		available: { caption: 'Oznacz jako dostępny', icon: 'check-circle', color: 'success' },
		assigned: { caption: 'Przypisz (błąd)', icon: 'user-check', color: 'primary' },
		broken: { caption: 'Zgłoś awarię', icon: 'triangle-warning', color: 'danger' },
		unmovable: { caption: 'Oznacz jako unieruchomiony', icon: 'ban', color: 'danger' },
		under_maintenance: { caption: 'Wyślij do serwisu', icon: 'wrench-simple', color: 'warning' },
		retired: { caption: 'Wycofaj z floty', icon: 'archive', color: 'secondary' }
	};

	const changeStatus = async (status: Vehicle.Status) => {
		if (loadingStatus) return;
		loadingStatus = status;

		try {
			const res = await internal.patch(`/vehicles/${vehicle.registrationNumber}/status`, { status });
			if (res.success) {
				vehicle.status = status;
				onstatuschanged?.(status);
			} else {
				alert(res.message || 'Wystąpił błąd podczas zmiany statusu.');
			}
		} catch (err: any) {
			alert(err.message || 'Wystąpił błąd podczas zmiany statusu.');
		} finally {
			loadingStatus = null;
		}
	};
</script>

{#each actions as status}
	{#if statusConfig[status]}
		<IconButton caption={statusConfig[status].caption} icon={statusConfig[status].icon} color={statusConfig[status].color} disabled={loadingStatus !== null} onclick={() => changeStatus(status)} size={6} />
	{/if}
{/each}
