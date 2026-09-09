<script lang="ts">
	import SectionCard from '$lib/misc/SectionCard.svelte';
	import { ALL_INSPECTION_ITEMS } from './inspection';
	import InspectionCheckItem from '$lib/form/InspectionCheckItem.svelte';
	import CameraCaptureInspection from '$lib/misc/CameraCaptureInspection.svelte';

	interface Props {
		monthly?: boolean;
	}

	let { monthly = false }: Props = $props();

	/** single state keyed by categoryKey */
	let checklist = $state<Record<string, boolean>>({});

	// initialise every item to unchecked
	for (const item of ALL_INSPECTION_ITEMS) {
		checklist[item.categoryKey] = false;
	}

	const images = ALL_INSPECTION_ITEMS.filter((i) => i.requiresPhoto);
	const daily = ALL_INSPECTION_ITEMS.filter((i) => i.frequency === 'daily' && !i.requiresPhoto);
	const monthlyItems = ALL_INSPECTION_ITEMS.filter((i) => i.frequency === 'monthly');

    const onFinished = (progress: SvelteCustom.SavedProgress<Vehicle.ImageInspectionCategory>) => {
        for (const [ type, { src } ] of Object.entries(progress)) {
            if (src.length && type in checklist) checklist[type] = true;
        }
    }
</script>

<SectionCard title="Zdjęcia">
	{#snippet cta()}
		<CameraCaptureInspection onfinished={onFinished} />
	{/snippet}
	<ul class="list-group">
		{#each images as item}
			<InspectionCheckItem bind:checked={checklist[item.categoryKey]} required caption={item.label} text={item.description} />
		{/each}
	</ul>
</SectionCard>

<SectionCard title="Codzienna inspekcja">
	<ul class="list-group">
		{#each daily as item}
			<InspectionCheckItem bind:checked={checklist[item.categoryKey]} required caption={item.label} text={item.description} />
		{/each}
	</ul>
</SectionCard>

{#if monthly}
	<SectionCard title="Miesięczna inspekcja">
		<ul class="list-group">
			{#each monthlyItems as item}
				<InspectionCheckItem bind:checked={checklist[item.categoryKey]} required caption={item.label} text={item.description} />
			{/each}
		</ul>
	</SectionCard>
{/if}
