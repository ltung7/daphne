<script lang="ts">
	import { goto } from '$app/navigation';
	import { cleanHandoverProtocol as defaultCleanHandoverProtocol } from '$lib/assets/cleanItems';
	import { handoverDocumentSchema } from '$lib/assets/zodschemas/handover.zod';
	import CardForm from '$lib/form/CardForm.svelte';
	import IconButton from '$lib/misc/IconButton.svelte';
	import { internal } from '$lib/nav/internal';
	import { endLoad, startLoad } from '$lib/nav/loader';
	import HandoverProtocolFields from './HandoverProtocolFields.svelte';
	import { addToast } from '$lib/toast';
	import { downloadFileBlob } from '$lib/utils/downloadDataLink';
	import type { Snippet } from 'svelte';

	interface Props {
		handoverProtocol: DocumentGenerator.HandoverDocument;
		cleanHandoverProtocol?: DocumentGenerator.HandoverDocument;
		postUrl: string;
		id?: string;
		readonly?: boolean;
		admin?: boolean;
		header?: Snippet;
	}

	let { handoverProtocol = $bindable(), cleanHandoverProtocol = defaultCleanHandoverProtocol, postUrl, id = $bindable(), readonly = false, admin = false, header }: Props = $props();

	const isClosed = $derived(Boolean((handoverProtocol as any).closed));
	const isCancelled = $derived(Boolean(handoverProtocol.cancelled));
	const isLocked = $derived(readonly || isClosed || isCancelled);

	function hasOnlyAllowedErrors<T extends object>(errors: Partial<Record<keyof T, string | undefined>>, allowedKeys: (keyof T)[]): boolean {
		const allowedSet = new Set<string>(allowedKeys as string[]);

		return Object.entries(errors).every(([ key, value ]) => {
			if (!value) return true;
			return allowedSet.has(key);
		});
	}

	const sendAction = async (action: 'pdf' | 'docusign' | 'save' | 'close' | 'cancel') => {
		if (action === 'cancel') {
			if (!confirm('Czy na pewno chcesz anulować ten protokół?')) return;
		}
		startLoad();
		if (action === 'pdf') {
			const response = await internal.post(postUrl, { id, action: 'save', handover: handoverProtocol });
			if (response.id) id = response.id;

			const pdfBlob: Blob = await internal.post(postUrl, { id, action, handover: handoverProtocol }, { responseType: 'blob' });
			if (pdfBlob.type === 'application/json') {
				endLoad();
				return addToast('Nie udało się wygenerować wydruku');
			}
			downloadFileBlob(pdfBlob, `Protokół wydania pojazdu ${handoverProtocol.registrationNumber} ${handoverProtocol.driverName}`, pdfBlob.type);
			endLoad();

			if (id) {
				setTimeout(() => {
					goto(`/handovers/${response.id}`);
				}, 500);
			}
		} else {
			const response = await internal.post(postUrl, { id, action, handover: handoverProtocol });
			endLoad();
			if (action === 'close' || action === 'cancel') {
				location.reload();
			} else if (response.id) {
				goto(`/handovers/${response.id}`);
			}
		}
	};
</script>

<CardForm item={handoverProtocol} cleanItem={cleanHandoverProtocol} name="handover" schema={handoverDocumentSchema}>
	{#snippet children({ errors, touch })}
		{#if header}
			{@render header()}
		{/if}
		<HandoverProtocolFields bind:handoverProtocol {touch} {errors} readonly={isLocked} />
	{/snippet}
	{#snippet submitSnippet({ isValid, errors })}
		{@const halfValid = hasOnlyAllowedErrors<DocumentGenerator.HandoverDocument>(errors, [ 'managerName', 'managerEmail' ])}
		<IconButton icon="disk" caption='Zapisz bez wydania' size={6} color="dark" class="ms-2 mb-0" disabled={!isValid || isLocked} onclick={() => sendAction('save')} />
		<IconButton icon="print" caption="Pobierz PDF" color="primary" size={6} class="ms-2 mb-0" disabled={!halfValid || isLocked} onclick={() => sendAction('pdf')} />
		<IconButton icon="digital-signature" caption="Wyślij DocuSign" color="success" size={6} class="ms-2 mb-0" disabled={!isValid || isLocked} onclick={() => sendAction('docusign')} />
		{#if id}
			<IconButton icon="cross-circle" caption="Anuluj" color="danger" size={6} class="ms-2 mb-0" disabled={isLocked} onclick={() => sendAction('cancel')} />
		{/if}
		{#if admin}
			<IconButton icon="handshake" caption="Zakończ (test)" color="warning" size={6} class="ms-2 mb-0" disabled={isLocked} onclick={() => sendAction('close')} />
		{/if}
	{/snippet}
</CardForm>