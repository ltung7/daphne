<script lang="ts">
	import ClosableModal from '$lib/misc/ClosableModal.svelte';
	import IconButton from '$lib/misc/IconButton.svelte';
	import { internal, confirmSuccess } from '$lib/nav/internal';
	import type { Snippet } from 'svelte';

	interface Props {
		// Trigger button props
		caption: string;
		icon: string;
		color?: string;

		// Modal props
		headerText: string;
		submitText?: string;

		// Note field config
		showNote?: boolean;
		requireNote?: boolean;
		noteLabel?: string;
		notePlaceholder?: string;

		// Action config
		url: string;
		targetStatus: string;
		extraPayload?: Record<string, any>;
		canSubmitExtra?: boolean;

		// Snippets
		alert?: Snippet;
		children?: Snippet;

		// Callback
		onsuccess?: (status: any) => void;
	}

	let {
		caption,
		icon,
		color = 'primary',
		headerText,
		submitText = 'Zatwierdź',
		showNote = true,
		requireNote = true,
		noteLabel = 'Powód',
		notePlaceholder = 'Podaj powód...',
		url,
		targetStatus,
		extraPayload = {},
		canSubmitExtra = true,
		alert,
		children,
		onsuccess
	}: Props = $props();

	let isOpen = $state(false);
	let loading = $state(false);
	let note = $state('');

	const canSubmit = $derived(
		canSubmitExtra && (!showNote || !requireNote || note.trim().length > 0)
	);

	const submitChange = async () => {
		if (!canSubmit) return;
		loading = true;

		try {
			const payload = {
				status: targetStatus,
				...(showNote ? { note } : {}),
				...extraPayload
			};

			const response = await confirmSuccess(internal.patch(url, payload));

			if (response.status) {
				onsuccess?.(response.status);
				isOpen = false;
				note = ''; // Reset form
			}
		} finally {
			loading = false;
		}
	};
</script>

<IconButton {caption} {icon} {color} onclick={() => (isOpen = true)} size={6} />

<ClosableModal bind:isOpen size="lg" {headerText}>
	{#if alert}
		<div class="mb-3">
			{@render alert()}
		</div>
	{/if}

	{#if children}
		<div class="mb-3">
			{@render children()}
		</div>
	{/if}

	{#if showNote}
		<div class="mb-3">
			<label for="statusChangeNote_{targetStatus}" class="form-label">{noteLabel}</label>
			<textarea 
				class="form-control" 
				id="statusChangeNote_{targetStatus}" 
				rows="3" 
				bind:value={note} 
				disabled={loading} 
				placeholder={notePlaceholder}
			></textarea>
		</div>
	{/if}

	{#snippet footer()}
		<button class="btn btn-{color} mb-0" disabled={!canSubmit || loading} onclick={submitChange}>
			{#if loading}
				<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
			{/if}
			{submitText}
		</button>
	{/snippet}
</ClosableModal>