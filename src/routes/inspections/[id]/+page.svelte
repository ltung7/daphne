<script lang="ts">
	import { untrack } from 'svelte';
	import type { PageProps } from './$types';
	import PageTitle from '$lib/misc/PageTitle.svelte';
	import SectionCard from '$lib/misc/SectionCard.svelte';
	import IconLink from '$lib/misc/IconLink.svelte';
	import { plTimezone } from '$lib/utils/tz';
	import { ALL_INSPECTION_ITEMS } from '$lib/components/inspection/inspection';

	let { data }: PageProps = $props();
	let inspection: DocumentGenerator.InspectionDocumentRecord = $state(untrack(() => data.inspection));
	const checklist = ALL_INSPECTION_ITEMS.filter((item) => {
		if (item.requiresPhoto) return false;
		return item.frequency === 'daily' || (item.frequency === 'monthly' && inspection.monthly);
	});
	const images = ALL_INSPECTION_ITEMS.filter((item) => item.requiresPhoto);

	const keyFromIndex = (index: any, key: any) => index[key];
</script>

<PageTitle title="Inspekcja {inspection.registrationNumber}" subtitle="{inspection.monthly ? 'Miesięczna' : 'Codzienna'} inspekcja">
	<IconLink icon="left" caption="Powrót do listy" href="/inspections" />
</PageTitle>

<SectionCard title="Dane inspekcji">
	<div class="row mb-3">
		<div class="col-12 col-md-6">
			<div class="text-muted xsmall">Numer rejestracyjny</div>
			<div class="fw-bold">{inspection.registrationNumber}</div>
		</div>
		<div class="col-12 col-md-6">
			<div class="text-muted xsmall">Kierowca</div>
			<div class="fw-bold">{inspection.assignedDriverName || 'Brak'}</div>
		</div>
	</div>
	<div class="row mb-3">
		<div class="col-12 col-md-6">
			<div class="text-muted xsmall">Typ inspekcji</div>
			<div class="fw-bold">{inspection.monthly ? 'Miesięczna' : 'Codzienna'}</div>
		</div>
		<div class="col-12 col-md-6">
			<div class="text-muted xsmall">Data</div>
			<div class="fw-bold">{plTimezone(inspection.timestamp)}</div>
		</div>
	</div>
	<div class="row mb-3">
		<div class="col-12">
			<div class="text-muted xsmall">Przesłał</div>
			<div class="fw-bold">{inspection.uploader}</div>
		</div>
	</div>
</SectionCard>

<SectionCard title="Checklista">
	{#each checklist as item}
		{@const value = keyFromIndex(inspection.checklist, item.categoryKey)}
		<div class="form-check">
			<input class="form-check-input opacity-10" type="checkbox" id="chklist_{item.categoryKey}" checked={value} disabled />
			<label class="form-check-label ms-2 opacity-10 text-dark" for="chklist_{item.categoryKey}">{item.description}</label>
		</div>
	{/each}
</SectionCard>

{#if inspection.images && Object.keys(inspection.images).length > 0}
	<SectionCard title="Zdjęcia">
		<div class="row">
			{#each images as image}
				{@const img = keyFromIndex(inspection.images, image.categoryKey)}
				<div class="col-12 col-md-4 mb-3">
					<div class="flex-center flex-column">
						<h6>{image.label}</h6>
						<a href={img.src} target="_blank" class="d-block mb-1">
							<img src={img.src} alt={image.label} class="img-thumbnail" style="max-width: 150px;" />
						</a>
					</div>
				</div>
			{/each}
		</div>
	</SectionCard>
{/if}
