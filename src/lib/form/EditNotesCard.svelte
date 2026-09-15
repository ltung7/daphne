<script lang="ts">
	import IconButton from '$lib/misc/IconButton.svelte';
	import SectionCard from '$lib/misc/SectionCard.svelte';
	import CustomFormTextarea from './CustomFormTextarea.svelte';
	import { m } from '$lib/paraglide/messages.js';

	interface Props {
		notes: string;
		editMode?: boolean;
	}

	let { notes = $bindable(), editMode = $bindable(false) }: Props = $props();

	const toggle = () => {
		editMode = !editMode;
	};
</script>

<SectionCard title={m.notes()}>
	{#snippet cta()}
		{#if !editMode}
			<IconButton caption={m.notes_edit()} icon="edit" onclick={toggle} size={6} />
		{/if}
	{/snippet}

	{#if editMode}
		<CustomFormTextarea bind:value={notes} size={4} class="mb-0" />
	{:else if notes.length}
		{notes}
	{:else}
		<div class="font-italic text-muted text-center">- {m.notes_empty()} -</div>
	{/if}
</SectionCard>
