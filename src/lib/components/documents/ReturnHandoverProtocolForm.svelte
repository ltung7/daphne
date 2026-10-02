<script lang="ts" generics="T extends DocumentGenerator.HandoverDocument & { id?: string; type?: Vehicle.HandoverDocumentType; foundItems?: string[] }">
	import { goto } from '$app/navigation';
	import { handoverDocumentSchema } from '$lib/assets/zodschemas/handover.zod';
	import CardForm from '$lib/form/CardForm.svelte';
	import IconButton from '$lib/misc/IconButton.svelte';
	import { internal } from '$lib/nav/internal';
	import { endLoad, startLoad } from '$lib/nav/loader';
	import { addToast } from '$lib/toast';
	import { downloadFileBlob } from '$lib/utils/downloadDataLink';
	import HandoverProtocolFields from './HandoverProtocolFields.svelte';
	import type { Snippet } from 'svelte';

	interface Props<T extends DocumentGenerator.HandoverDocument & { id?: string; type?: Vehicle.HandoverDocumentType; foundItems?: string[] }> {
		handoverProtocol: T;
		cleanHandoverProtocol: T;
		postUrl: string;
		unilateral?: boolean;
		requiredEquipment?: T;
		docTitle: string;
		id?: string;
		admin?: boolean;
		header?: Snippet;
	}

	let { handoverProtocol = $bindable(), cleanHandoverProtocol, postUrl, unilateral = false, requiredEquipment, docTitle, id = $bindable(), admin = false, header }: Props<T> = $props();

	const sendAction = async (action: 'pdf' | 'save' | 'close') => {
		startLoad();
		if (action === 'pdf') {
			const response = await internal.post(postUrl, { id, action: 'save', handover: handoverProtocol });
			if (response.id) id = response.id;

			const pdfBlob: Blob = await internal.post(postUrl, { id, action, handover: handoverProtocol }, { responseType: 'blob' });
			if (pdfBlob.type === 'application/json') {
				endLoad();
				return addToast('Nie udało się wygenerować wydruku');
			}
			downloadFileBlob(pdfBlob, `${docTitle} ${handoverProtocol.registrationNumber} ${handoverProtocol.driverName}`, pdfBlob.type);
			endLoad();

			if (id) {
				setTimeout(() => {
					goto(`/handovers/${response.id}`);
				}, 500);
			}
		} else {
			const response = await internal.post(postUrl, { id, action, handover: handoverProtocol });
			endLoad();
			if (action === 'close') {
				location.reload();
			} else if (response.id) {
				goto(`/handovers/${response.id}`);
			}
		}
	};

	function hasOnlyAllowedErrors<T extends object>(errors: Partial<Record<keyof T, string | undefined>>, allowedKeys: (keyof T)[]): boolean {
		const allowedSet = new Set<string>(allowedKeys as string[]);

		return Object.entries(errors).every(([ key, value ]) => {
			if (!value) return true;
			return allowedSet.has(key);
		});
	}
</script>

<CardForm item={handoverProtocol} cleanItem={cleanHandoverProtocol} name="handover" schema={handoverDocumentSchema as any}>
	{#snippet children({ errors, touch })}
		{#if header}
			{@render header()}
		{/if}
		<HandoverProtocolFields bind:handoverProtocol {requiredEquipment} {touch} errors={errors as Partial<Record<keyof DocumentGenerator.HandoverDocument, string | undefined>>} />
	{/snippet}
	{#snippet submitSnippet({ isValid, errors })}
		{@const halfValid = hasOnlyAllowedErrors<DocumentGenerator.HandoverDocument>(errors, [ 'managerName', 'managerEmail' ])}
		<IconButton icon="disk" caption={unilateral ? 'Zapisz bez odbioru' : 'Zapisz bez zwrotu'} size={6} color="dark" class="ms-2 mb-0" disabled={!isValid} onclick={() => sendAction('save')} />
		<IconButton icon="print" caption="Pobierz PDF" color="primary" size={6} class="ms-2 mb-0" disabled={!halfValid} onclick={() => sendAction('pdf')} />
		{#if admin}
			<IconButton icon="handshake" caption="Zakończ (test)" color="warning" size={6} class="ms-2 mb-0" onclick={() => sendAction('close')} />
		{/if}
	{/snippet}
</CardForm>
