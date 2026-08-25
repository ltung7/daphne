<script lang="ts">
	import { Tooltip } from '@sveltestrap/sveltestrap';
	import UIcon from "./UIcon.svelte";

	type Status = 'closed' | 'printed' | 'signed' | 'pending' | 'open';

	interface Props {
		handover: DocumentGenerator.HandoverDocumentRecord;
		size?: number;
	}

	let { handover, size = 8 }: Props = $props();

	interface StatusConfig {
		icon: string;
        caption: string;
		text: string;
		color: string;
	}

	const statusMap: Record<Status, StatusConfig> = {
		closed: {
			icon: 'check-circle',
			caption: "Zamknięty",
			text: 'Protokół zostały zamknięty bez DocuSign',
			color: '#2d6a4f'
		},
		signed: {
			icon: 'digital-signature',
			caption: "Podpisany z DocuSign",
			color: '#2e7d32',
			text: "Dokument został podposany za pomoca DocuSign"
		},
		open: {
			icon: 'edit',
			caption: "Otwarty",
			text: "Dokument jest w trakcie edycji / weryfikacji",
			color: '#757575',
		},
		pending: {
			icon: 'duration',
			caption: 'Oczekuje na podpis DocuSign',
			text: "Dokument został wysłany przez DocuSign i oczekuje na podpis/y",
			color: '#4a148c',
		},
		printed: {
			icon: 'print',
			caption: 'Wydrukowany',
			text: "Dokument został wydrukowany",
			color: '#1565c0',
		}

	};

	let status: Status = $derived.by(() => {
		if (handover.docusignId) {
			if (handover.docusignSigned) return 'signed';
			else return 'pending';
		}
		if (handover.closed) return 'closed';
		if (handover.printed) return 'printed'
		return 'open';
	})
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
