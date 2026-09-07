<script lang="ts">
	import IconButton from '$lib/misc/IconButton.svelte';
	import SectionCard from '$lib/misc/SectionCard.svelte';
	import CustomFormTextarea from './CustomFormTextarea.svelte';

	interface Props {
		notes: string;
	}

	let { notes = $bindable() }: Props = $props();
	let editMode: boolean = $state(false);

	const toggle = () => {
		editMode = !editMode;
	};
</script>

<SectionCard title="Notatki">
	{#snippet cta()}
		<IconButton caption="Edytuj" icon="edit" onclick={toggle} size={6} />
	{/snippet}

	{#if editMode}
		<CustomFormTextarea bind:value={notes} size={4} class="mb-0" />
	{:else if notes.length}
		{notes}
	{:else}
		<div class="font-italic text-muted text-center">- Brak notatki -</div>
	{/if}
</SectionCard>
