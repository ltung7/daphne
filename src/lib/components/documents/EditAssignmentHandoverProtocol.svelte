<script lang="ts">
	import SectionCard from '$lib/misc/SectionCard.svelte';
	import AssignmentHandoverProtocolForm from './AssignmentHandoverProtocolForm.svelte';
	import HandoverProtocolStatusCard from './HandoverProtocolStatusCard.svelte';

	interface Props {
		handoverProtocol: DocumentGenerator.HandoverDocumentRecord;
		admin?: boolean;
	}

	let { handoverProtocol, admin = false }: Props = $props();
</script>

<HandoverProtocolStatusCard {handoverProtocol} />

<SectionCard title="Edycja" noCard>
	<AssignmentHandoverProtocolForm {handoverProtocol} postUrl="/handovers/{handoverProtocol.id}/api" id={handoverProtocol.id} readonly={Boolean(handoverProtocol.docusignSigned)} {admin} />
</SectionCard>
