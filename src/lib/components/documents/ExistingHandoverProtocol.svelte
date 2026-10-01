<script lang="ts">
	import { goto } from '$app/navigation';
	import IconButton from '$lib/misc/IconButton.svelte';
	import { internal } from '$lib/nav/internal';
	import { endLoad, startLoad } from '$lib/nav/loader';
	import { downloadFileBlob } from '$lib/utils/downloadDataLink';
	import axios from 'axios';
	import HandoverProtocolFields from './HandoverProtocolFields.svelte';
	import HandoverProtocolStatusCard from './HandoverProtocolStatusCard.svelte';
	import SectionCard from '$lib/misc/SectionCard.svelte';

	interface Props {
		handoverProtocol: DocumentGenerator.HandoverDocumentRecord;
	}

	let { handoverProtocol }: Props = $props();

	const downloadBlob = async () => {
		if (!handoverProtocol.url) return;
		const pdfBlob: Blob = await axios.get(handoverProtocol.url, { responseType: 'blob' }).then((res) => res.data);
		downloadFileBlob(pdfBlob, `Protokół wydania pojazdu ${handoverProtocol.registrationNumber} ${handoverProtocol.driverName}`, pdfBlob.type);
	};

	const sendAction = async (action: 'pdf' | 'docusign') => {
		startLoad();
		if (action === 'pdf') {
			const pdfBlob: Blob = await internal.postApi({ action }, 'post', { responseType: 'blob' });
			downloadFileBlob(pdfBlob, `Protokół wydania pojazdu ${handoverProtocol.registrationNumber} ${handoverProtocol.driverName}`, pdfBlob.type);
			endLoad();
		} else {
			const response = await internal.postApi({ action }, 'post');
			endLoad();
			if (response.id) goto(`/handovers/${response.id}`);
		}
	};
</script>

<HandoverProtocolStatusCard {handoverProtocol} />

<SectionCard title="Edycja" noCard>
	<div class="card mt-3">
		<h5 class="card-header">Protokół zdawczo - odbiorczy</h5>
		<div class="card-body">
			<HandoverProtocolFields {handoverProtocol} readonly />
		</div>
		<div class="card-footer">
			<div class="d-flex justify-content-end">
				{#if handoverProtocol.url}
					<IconButton icon="print" caption="Pobierz z DocuSign" color="primary" size={6} class="ms-2 mb-0" onclick={() => downloadBlob()} />
				{:else}
					<IconButton icon="print" caption="Pobierz PDF" color="primary" size={6} class="ms-2 mb-0" onclick={() => sendAction('pdf')} />
				{/if}
				<IconButton icon="digital-signature" caption="Wyślij DocuSign" color="success" size={6} class="ms-2 mb-0" onclick={() => sendAction('docusign')} disabled={Boolean(handoverProtocol.docusignSigned)} />
			</div>
		</div>
	</div>
</SectionCard>
