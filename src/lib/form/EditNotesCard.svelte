<script lang="ts">
	import TooltipSquareIconButton from '$lib/misc/TooltipSquareIconButton.svelte';
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

<div class="card mt-3">
	<h5 class="card-header flex-between">
		Notatki
		<div class="my-n3">
			<TooltipSquareIconButton icon="edit" onClick={toggle} hoverText="Edytuj" />
		</div>
	</h5>
	<div class="card-body">
		{#if editMode}
			<CustomFormTextarea bind:value={notes} size={4} class="" />
		{:else if notes.length}
			{notes}
		{:else}
			<div class="font-italic text-muted text-center">- Brak notatki -</div>
		{/if}
	</div>
</div>
