<script lang="ts">
	import { Tooltip } from '@sveltestrap/sveltestrap';
	import UIcon from "./UIcon.svelte";

	interface Props {
		status: Driver.Status;
		size?: number;
	}

	let { status, size = 8 }: Props = $props();

	interface StatusConfig {
		icon: string;
        caption: string;
		text: string;
		color: string;
	}

	const statusMap: Record<Driver.Status, StatusConfig> = {
		pending_verification: {
			icon: 'clipboard-check',
			caption: 'Weryfikacja dokumentów',
			text: 'Dokumenty i informacje oczekują na weryfikację.',
			color: '#8b5cf6'
		},
		rejected: {
			icon: 'triangle-warning',
			caption: 'Odrzucono',
			text: 'Zgłoszenie zostało odrzucone. Proszę sprawdzić szczegóły.',
			color: '#ef4444'
		},
		available: {
			icon: 'check-circle',
			caption: 'Dostępny',
			text: 'Kierowca jest dostępny i oczekuje na przydzielnie pojazdu.',
			color: '#22c55e'
		},
		active: {
			icon: 'user-check',
			caption: 'Aktywny',
			text: 'Kierowca jest aktywny i upoważniony do odbierania zleceń.',
			color: '#3b82f6'
		},
		inactive: {
			icon: 'user-forbidden-alt',
			caption: 'Nieaktywny',
			text: 'Kierowca jest nieaktywny i nie może odbierać zleceń.',
			color: '#6b7280'
		},
		documents_expiring: {
			icon: 'portfolio',
			caption: 'Dokumenty wygasają',
			text: 'Dokumenty wygasają wkrótce. Prosimy o ich odnowienie.',
			color: '#f59e0b'
		},
		documents_expired: {
			icon: 'portfolio',
			caption: 'Dokumenty wygasły',
			text: 'Dokumenty wygasły. Konto zostało zablokowane do czasu ich odnowienia.',
			color: '#dc2626'
		},
		suspended: {
			icon: 'user-forbidden',
			caption: 'Zawieszony',
			text: 'Konto zostało tymczasowo zawieszone z powodu naruszeń zasad.',
			color: '#895129'
		},
		banned: {
			icon: 'user-forbidden',
			caption: 'Zablokowany',
			text: 'Konto zostało trwale zablokowane. Proszę skontaktować się z administracją.',
			color: '#991b1b'
		},
		archived: {
			icon: 'archive',
			caption: 'Zarchiwizowany',
			text: 'Konto zostało zarchiwizowane, niedostępne dla nowych zleceń.',
			color: '#6b7280'
		},
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
