<script lang="ts">
	import IconButton from '$lib/misc/IconButton.svelte';
	import { internal } from '$lib/nav/internal';

	interface Props {
		driver: Driver.Driver;
		actions: Driver.Status[];
		onstatuschanged?: (status: Driver.Status) => void;
	}

	let { driver, actions, onstatuschanged }: Props = $props();

	let loadingStatus = $state<Driver.Status | null>(null);

	const statusConfig: Record<Driver.Status, { caption: string; icon: string; color?: string }> = {
		pending_verification: { caption: 'Do ponownej weryfikacji', icon: 'clipboard-check', color: 'secondary' },
		rejected: { caption: 'Odrzuć', icon: 'triangle-warning', color: 'danger' },
		available: { caption: 'Oznacz jako dostępny', icon: 'check-circle', color: 'success' },
		active: { caption: 'Aktywuj', icon: 'user-check', color: 'primary' },
		inactive: { caption: 'Przerwa do końca dnia', icon: 'user-forbidden-alt', color: 'secondary' },
		on_leave: { caption: 'Urlop', icon: 'calendar', color: 'warning' },
		documents_expired: { caption: 'Brak dokumentów', icon: 'portfolio', color: 'danger' },
		suspended: { caption: 'Zawieś', icon: 'user-forbidden', color: 'danger' },
		banned: { caption: 'Zablokuj', icon: 'user-forbidden', color: 'danger' },
		archived: { caption: 'Archiwizuj', icon: 'archive', color: 'secondary' }
	};

	const changeStatus = async (status: Driver.Status) => {
		if (loadingStatus) return;
		loadingStatus = status;

		try {
			const res = await internal.patch(`/drivers/${driver.id}/status`, { status });
			if (res.success) {
				driver.status = status;
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
