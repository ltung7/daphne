<script lang="ts" module>
	import { m } from '$lib/paraglide/messages.js';

	interface MessageCollection {
		label: () => string;
		description: () => string;
	}

	interface MessagesInterface {
		PHOTOS: Record<string, MessageCollection>;
		DAILY: Record<string, MessageCollection>;
		MONTHLY: Record<string, MessageCollection>;
	}

	export const MESSAGES: MessagesInterface = {
		PHOTOS: {
			photo_dashboard: {
				label: m.inspection_photo_dashboard_label,
				description: m.inspection_photo_dashboard_description,
			},
			photo_front: {
				label: m.inspection_photo_front_label,
				description: m.inspection_photo_front_description,
			},
			photo_rear: {
				label: m.inspection_photo_rear_label,
				description: m.inspection_photo_rear_description,
			},
			photo_left_side: {
				label: m.inspection_photo_left_side_label,
				description: m.inspection_photo_left_side_description,
			},
			photo_right_side: {
				label: m.inspection_photo_right_side_label,
				description: m.inspection_photo_right_side_description,
			},
		},
		DAILY: {
			tires: {
				label: m.inspection_tires_label,
				description: m.inspection_tires_description,
			},
			cleanliness: {
				label: m.inspection_cleanliness_label,
				description: m.inspection_cleanliness_description,
			},
			lost_property: {
				label: m.inspection_lost_property_label,
				description: m.inspection_lost_property_description,
			},
			dashboard_alerts: {
				label: m.inspection_dashboard_alerts_label,
				description: m.inspection_dashboard_alerts_description,
			},
		},
		MONTHLY: {
			lighting: {
				label: m.inspection_lighting_label,
				description: m.inspection_lighting_description,
			},
			safety_gear: {
				label: m.inspection_safety_gear_label,
				description: m.inspection_safety_gear_description,
			},
			fluids: {
				label: m.inspection_fluids_label,
				description: m.inspection_fluids_description,
			},
			brakes: {
				label: m.inspection_brakes_label,
				description: m.inspection_brakes_description,
			},
			documentation: {
				label: m.inspection_documentation_label,
				description: m.inspection_documentation_description,
			},
		},
	};
</script>

<script lang="ts">
	import SectionCard from '$lib/misc/SectionCard.svelte';
	import { ALL_INSPECTION_ITEMS } from '../inspection';
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

	const photos = ALL_INSPECTION_ITEMS.filter((i) => i.requiresPhoto);
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
		addToast(m.inspection_saved(), 'success');
		if (response.id) {
			goto('/inspections/' + response.id);
		}
	};
</script>

<SectionCard title={m.inspection_photos_title()}>
	{#snippet cta()}
		<CameraCaptureInspection onfinished={onFinished} />
	{/snippet}
	<ul class="list-group">
		{#each photos as item}
			<InspectionCheckItem
				bind:checked={checklist[item.categoryKey]}
				required
				caption={MESSAGES.PHOTOS[item.categoryKey].label()}
				text={MESSAGES.PHOTOS[item.categoryKey].description()}
				disabled
			/>
		{/each}
	</ul>
</SectionCard>

<SectionCard title={m.inspection_daily_title()}>
	<ul class="list-group">
		{#each daily as item}
			<InspectionCheckItem
				bind:checked={checklist[item.categoryKey]}
				required
				caption={MESSAGES.DAILY[item.categoryKey].label()}
				text={MESSAGES.DAILY[item.categoryKey].description()}
			/>
		{/each}
	</ul>
</SectionCard>

{#if monthly}
	<SectionCard title={m.inspection_monthly_title()}>
		<ul class="list-group">
			{#each monthlyItems as item}
				<InspectionCheckItem
					bind:checked={checklist[item.categoryKey]}
					required
					caption={MESSAGES.MONTHLY[item.categoryKey].label()}
					text={MESSAGES.MONTHLY[item.categoryKey].description()}
				/>
			{/each}
		</ul>
	</SectionCard>
{/if}

<EditNotesCard bind:notes editMode />

<SectionCard title={m.inspection_approve_title()}>
	<div class="flex-between fs-6">
		<div>
			{m.inspection_completed()} <div class="badge bg-primary">{checked} / {total}</div>
		</div>
		<IconButton icon="save" caption={m.inspection_save()} onclick={handleSave} />
	</div>
</SectionCard>