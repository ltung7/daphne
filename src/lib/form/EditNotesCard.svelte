<script lang="ts">
	import IconButton from '$lib/misc/IconButton.svelte';
	import SectionCard from '$lib/misc/SectionCard.svelte';
	import CustomFormTextarea from './CustomFormTextarea.svelte';

	interface Props {
		notes: string;
		editMode?: boolean;
	}

	let { notes = $bindable(), editMode = $bindable(false) }: Props = $props();

	const toggle = () => {
		editMode = !editMode;
	};
</script>

<SectionCard title="Notatki">
	{#snippet cta()}
		{#if !editMode}
			<IconButton caption="Edytuj" icon="edit" onclick={toggle} size={6} />
		{/if}
	{/snippet}

	{#if editMode}
		<CustomFormTextarea bind:value={notes} size={4} class="mb-0" />
	{:else if notes.length}
		{notes}
	{:else}
		<div class="font-italic text-muted text-center">- Brak notatki -</div>
	{/if}
</SectionCard>
