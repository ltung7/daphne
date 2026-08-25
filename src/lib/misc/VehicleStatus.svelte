<script lang="ts">
	import { Tooltip } from '@sveltestrap/sveltestrap';
	import UIcon from "./UIcon.svelte";

	interface Props {
		status: Vehicle.Status;
		size?: number;
	}

	let { status, size = 8 }: Props = $props();

	interface StatusConfig {
		icon: string;
        caption: string;
		text: string;
		color: string;
	}

	const statusMap: Record<Vehicle.Status, StatusConfig> = {
		available: {
			icon: 'check-circle',
			caption: 'Dostępny',
			text: 'Pojazd jest sprawny i gotowy do przypisania.',
			color: '#22c55e'
		},
		assigned: {
			icon: 'user-check',
			caption: 'Przypisany',
			text: 'Pojazd został przypisany do kierowcy lub zadania.',
			color: '#3b82f6'
		},
		broken: {
			icon: 'triangle-warning',
			caption: 'Uszkodzony',
			text: 'Pojazd jest niesprawny i wymaga naprawy.',
			color: '#ef4444'
		},
		unmovable: {
			icon: 'ban',
			caption: 'Unieruchomiony',
			text: 'Pojazd nie może zostać przemieszczony w obecnym stanie.',
			color: '#b91c1c'
		},
		under_maintenance: {
			icon: 'wrench-simple',
			caption: 'W serwisie',
			text: 'Pojazd znajduje się obecnie w trakcie przeglądu lub naprawy.',
			color: '#f59e0b'
		},
		retired: {
			icon: 'archive',
			caption: 'Wycofany',
			text: 'Pojazd został trwale wycofany z eksploatacji.',
			color: '#6b7280'
		},
		precheck: {
			icon: 'clipboard-check',
			caption: 'Weryfikacja',
			text: 'Pojazd oczekuje na kontrolę wstępną przed dopuszczeniem do użytku.',
			color: '#8b5cf6'
		}
	};

	let current = $derived(statusMap[status]);
    let element = $state<HTMLElement>();
</script>

{#if element}
    <Tooltip target={element} placement="top">
        <span class="tooltip-text">{@html current.text}</span>
    </Tooltip>
{/if}

<div class="d-inline-flex align-items-center justify-contents-center fs-{size} badge cursor-help" style="background-color: {current.color};" bind:this={element}>
    <UIcon name={current.icon}  />
	<span class="ms-2">{current.caption}</span>
</div>
