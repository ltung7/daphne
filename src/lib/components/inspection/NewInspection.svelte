<script lang="ts">
	import SectionCard from '$lib/misc/SectionCard.svelte';
	import { ALL_INSPECTION_ITEMS } from './inspection';
	import InspectionCheckItem from '$lib/form/InspectionCheckItem.svelte';
	import CameraCaptureInspection from '$lib/misc/CameraCaptureInspection.svelte';
	import IconButton from '$lib/misc/IconButton.svelte';
	import { confirmSuccess, internal } from '$lib/nav/internal';
	import { addToast } from '$lib/toast';
	import { goto } from '$app/navigation';
	import EditNotesCard from '$lib/form/EditNotesCard.svelte';

	interface Props {
		vehicle: Vehicle.Vehicle;
		monthly?: boolean;
	}

	let { monthly = false, vehicle }: Props = $props();

	/** single state keyed by categoryKey */
	let checklist = $state<Record<string, boolean>>({});
	let images: SvelteCustom.SavedProgress<Vehicle.ImageInspectionCategory> = $state({});
	let notes: string = $state('');

	// initialise every item to unchecked
	for (const item of ALL_INSPECTION_ITEMS) {
		checklist[item.categoryKey] = false;
	}

	// Derived: total relevant items based on monthly flag
	const total = $derived(
		ALL_INSPECTION_ITEMS.filter((item) => {
			if (!monthly) return item.frequency === 'daily';
			return true; // monthly includes both daily and monthly
		}).length
	);

	// Derived: count of checked relevant items
	const checked = $derived(
		ALL_INSPECTION_ITEMS.filter((item) => {
			if (!monthly) return item.frequency === 'daily';
			return true;
		}).filter((item) => checklist[item.categoryKey] === true).length
	);

	const imagesList = ALL_INSPECTION_ITEMS.filter((i) => i.requiresPhoto);
	const daily = ALL_INSPECTION_ITEMS.filter((i) => i.frequency === 'daily' && !i.requiresPhoto);
	const monthlyItems = ALL_INSPECTION_ITEMS.filter((i) => i.frequency === 'monthly');

	const onFinished = (progress: SvelteCustom.SavedProgress<Vehicle.ImageInspectionCategory>) => {
		Object.assign(images, progress);
		for (const [ type, { src } ] of Object.entries(progress)) {
			if (src.length && type in checklist) checklist[type] = true;
		}
	};

	function createFilteredChecklist(): Record<string, boolean> {
		const relevantItems = ALL_INSPECTION_ITEMS.filter((item) => {
			if (!monthly) return item.frequency === 'daily';
			return true;
		});

		const filtered: Record<string, boolean> = {};
		for (const item of relevantItems) {
			filtered[item.categoryKey] = checklist[item.categoryKey] ?? false;
		}

		return filtered;
	}

	const handleSave = async () => {
		const filteredChecklist = createFilteredChecklist();

		const document: DocumentGenerator.InspectionDocument = {
			monthly,
			images,
			registrationNumber: vehicle.registrationNumber,
			assignedDriverId: vehicle.assignedDriverId,
			assignedDriverName: vehicle.assignedDriverName,
			checklist: filteredChecklist,
			notes
		};
		
		const response = await confirmSuccess(internal.postApi(document));
		addToast('Inspekcja zapisana', 'success');
		if (response.id) {
			goto('/inspections/' + response.id);
		}
	};
</script>

<SectionCard title="Zdjęcia">
	{#snippet cta()}
		<CameraCaptureInspection onfinished={onFinished} />
	{/snippet}
	<ul class="list-group">
		{#each imagesList as item}
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

<EditNotesCard bind:notes editMode />

<SectionCard title="Zatwierdź">
	<div class="flex-between fs-6">
		<div>
			Zakończono <div class="badge bg-primary">{checked} / {total}</div>
		</div>
		<IconButton icon="save" caption="Zapisz" onclick={handleSave} />
	</div>
</SectionCard>