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

	interface Props<T extends DocumentGenerator.HandoverDocument & { id?: string; type?: Vehicle.HandoverDocumentType; foundItems?: string[]; cancelled?: number; closed?: false | number }> {
		handoverProtocol: T;
		cleanHandoverProtocol: T;
		postUrl: string;
		unilateral?: boolean;
		requiredEquipment?: T;
		docTitle: string;
		id?: string;
		readonly?: boolean;
		admin?: boolean;
		header?: Snippet;
		extraFields?: Snippet<[{ model: T, errors: Partial<Record<keyof T, string | undefined>>, touch: (field: keyof T) => void }]>;
	}

	let { handoverProtocol = $bindable(), cleanHandoverProtocol, postUrl, unilateral = false, requiredEquipment, docTitle, id = $bindable(), readonly = false, admin = false, header, extraFields }: Props<T> = $props();

	const isClosed = $derived(Boolean((handoverProtocol as any).closed));
	const isCancelled = $derived(Boolean(handoverProtocol.cancelled));
	const isLocked = $derived(readonly || isClosed || isCancelled);

	const sendAction = async (action: 'pdf' | 'save' | 'close' | 'cancel') => {
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
			if (action === 'close' || action === 'cancel') {
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
		{#if extraFields}
			{@render extraFields({ model: handoverProtocol, errors: errors as any, touch: touch as any })}
		{/if}
		<HandoverProtocolFields bind:handoverProtocol {requiredEquipment} {touch} errors={errors as Partial<Record<keyof DocumentGenerator.HandoverDocument, string | undefined>>} readonly={isLocked} />
	{/snippet}
	{#snippet submitSnippet({ isValid, errors })}
		{@const halfValid = hasOnlyAllowedErrors<DocumentGenerator.HandoverDocument>(errors, [ 'managerName', 'managerEmail' ])}
		<IconButton icon="disk" caption={unilateral ? 'Zapisz bez odbioru' : 'Zapisz bez zwrotu'} size={6} color="dark" class="ms-2 mb-0" disabled={!isValid || isLocked} onclick={() => sendAction('save')} />
		<IconButton icon="print" caption="Pobierz PDF" color="primary" size={6} class="ms-2 mb-0" disabled={!halfValid || isLocked} onclick={() => sendAction('pdf')} />
		{#if id}
			<IconButton icon="cross-circle" caption="Anuluj" color="danger" size={6} class="ms-2 mb-0" disabled={isLocked} onclick={() => sendAction('cancel')} />
		{/if}
		{#if admin}
			<IconButton icon="handshake" caption="Zakończ (test)" color="warning" size={6} class="ms-2 mb-0" disabled={isLocked} onclick={() => sendAction('close')} />
		{/if}
	{/snippet}
</CardForm>
