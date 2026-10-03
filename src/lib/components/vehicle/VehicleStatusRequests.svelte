<script lang="ts">
	import StatusChangeModal from '$lib/misc/StatusChangeModal.svelte';

	export type StatusRequestAction = 'broken' | 'unmovable';

	interface Props {
		vehicle: Vehicle.Vehicle;
		actions: StatusRequestAction[];
		onstatuschanged?: (status: Vehicle.Status) => void;
	}

	let { vehicle, actions, onstatuschanged }: Props = $props();

	const requestConfig: Record<StatusRequestAction, {
		caption: string;
		icon: string;
		color: string;
		headerText: string;
		submitText: string;
		noteLabel: string;
		notePlaceholder: string;
	}> = {
		broken: {
			caption: 'Zgłoś awarię',
			icon: 'triangle-warning',
			color: 'danger',
			headerText: 'Zgłoszenie awarii pojazdu',
			submitText: 'Zgłoś awarię',
			noteLabel: 'Opis awarii',
			notePlaceholder: 'Opisz usterkę (np. uszkodzone zawieszenie, nie odpala, stłuczka)...'
		},
		unmovable: {
			caption: 'Oznacz jako unieruchomiony',
			icon: 'ban',
			color: 'danger',
			headerText: 'Oznaczenie pojazdu jako unieruchomiony',
			submitText: 'Unieruchom pojazd',
			noteLabel: 'Powód unieruchomienia',
			notePlaceholder: 'Podaj powód unieruchomienia (np. zatrzymany dowód rejestracyjny, brak ważnych badań, zakaz poruszania się)...'
		}
	};
</script>

{#each actions as action}
	{#if requestConfig[action]}
		{@const config = requestConfig[action]}
		<StatusChangeModal
			caption={config.caption}
			icon={config.icon}
			color={config.color}
			headerText={config.headerText}
			submitText={config.submitText}
			noteLabel={config.noteLabel}
			notePlaceholder={config.notePlaceholder}
			url="/vehicles/{vehicle.registrationNumber}/status"
			targetStatus={action}
			onsuccess={onstatuschanged}
		/>
	{/if}
{/each}
