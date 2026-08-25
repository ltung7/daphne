<script lang="ts">
	import { goto } from '$app/navigation';
	import HandoverStatus from '$lib/misc/HandoverStatus.svelte';
	import IconButton from '$lib/misc/IconButton.svelte';
	import { internal } from '$lib/nav/internal';
	import { endLoad, startLoad } from '$lib/nav/loader';
	import { downloadFileBlob } from '$lib/utils/downloadDataLink';
	import { optionalTimestamp } from '$lib/utils/tz';
	import axios from 'axios';
	import HandoverProtocolFields from './HandoverProtocolFields.svelte';

	interface Props {
		handoverProtocol: DocumentGenerator.HandoverDocumentRecord;
	}

	let { handoverProtocol }: Props = $props();

	const downloadBlob = async () => {
		if (!handoverProtocol.url) return
		const pdfBlob: Blob = await axios.get(handoverProtocol.url, { responseType: 'blob' }).then(res => res.data);
		downloadFileBlob(pdfBlob, `Protokół wydania pojazdu ${handoverProtocol.registrationNumber} ${handoverProtocol.driverName}`, pdfBlob.type);
	}

	const sendAction = async (action: 'pdf' | 'docusign' | 'close') => {
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

<svelte:head>
	<title>Protokół zdawczo - odbiorczy</title>
</svelte:head>

<div class="card mt-3">
	<h5 class="card-header">Protokół zdawczo - odbiorczy</h5>
	<div class="card-body">
		<section class="pb-3 mb-3 border-bottom text-dark">
			<div style="max-width: 400px" class="mx-auto">
				<div class="flex-between">
					<div>Status protokołu</div>
					<HandoverStatus handover={handoverProtocol} />
				</div>
				<div class="flex-between">
					<div>Data wydruku</div>
					<div>{optionalTimestamp(handoverProtocol.printed)}</div>
				</div>
				<div class="flex-between">
					<div>Data wysyłki DocusSign</div>
					<div>{optionalTimestamp(handoverProtocol.docusignSent)}</div>
				</div>
				<div class="flex-between">
					<div>Data podpisu DocusSign</div>
					<div>{optionalTimestamp(handoverProtocol.docusignSigned)}</div>
				</div>
			</div>
		</section>
		<HandoverProtocolFields {handoverProtocol} readonly />
	</div>
	<div class="card-footer">
		<div class="d-flex justify-content-end">
			<IconButton icon="cross" caption="Wydaj bez dokumentu" color="dark" size={6} class="ms-2 mb-0" onclick={() => sendAction('close')} disabled={Boolean(handoverProtocol.closed)} />
			{#if handoverProtocol.url}
				<IconButton icon="print" caption="Pobierz z DocuSign" color="primary" size={6} class="ms-2 mb-0" onclick={() => downloadBlob()} />
			{:else}
				<IconButton icon="print" caption="Pobierz PDF" color="primary" size={6} class="ms-2 mb-0" onclick={() => sendAction('pdf')} />
			{/if}
			<IconButton icon="digital-signature" caption="Wyślij DocuSign" color="success" size={6} class="ms-2 mb-0" onclick={() => sendAction('docusign')} disabled={Boolean(handoverProtocol.docusignSigned)} />
		</div>
	</div>
</div>
