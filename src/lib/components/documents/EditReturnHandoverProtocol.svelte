<script lang="ts">
	import ReturnHandoverProtocolForm from './ReturnHandoverProtocolForm.svelte';
	import { cleanHandoverProtocol } from '$lib/assets/cleanItems';
	import { untrack } from 'svelte';
	import HandoverProtocolStatusCard from './HandoverProtocolStatusCard.svelte';
	import SectionCard from '$lib/misc/SectionCard.svelte';

	interface Props {
		handoverProtocol: DocumentGenerator.HandoverDocumentRecord;
		initialHandover?: DocumentGenerator.HandoverDocumentRecord;
		admin?: boolean;
	}

	let { handoverProtocol, initialHandover, admin = false }: Props = $props();

	const unilateral = untrack(() => handoverProtocol.type === 'unilateral');
	const docTitle = unilateral ? 'Edycja protokołu jednostronnego odbioru pojazdu' : 'Edycja protokołu zwrotu pojazdu';
</script>

<HandoverProtocolStatusCard {handoverProtocol} />

<SectionCard title="Edycja" noCard>
	<ReturnHandoverProtocolForm bind:handoverProtocol {cleanHandoverProtocol} postUrl={`/handovers/${initialHandover?.id || 'edit'}/${unilateral ? 'unilateral' : 'return'}/api`} {unilateral} {docTitle} requiredEquipment={initialHandover} id={handoverProtocol.id} {admin} />
</SectionCard>
