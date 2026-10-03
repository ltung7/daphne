<script lang="ts">
	import { cleanHandoverProtocol } from '$lib/assets/cleanItems';
	import { handoverEquipmentList as equipmentList } from '$lib/assets/constants';
	import SearchBar from '$lib/misc/SearchBar.svelte';
	import type { SelectEventDetail } from '$lib/misc/Typeahead.svelte';
	import { fetchHandoverSigners } from '$lib/nav/fetchData';
	import { onMount } from 'svelte';
	import ReturnHandoverProtocolForm from './ReturnHandoverProtocolForm.svelte';

	interface Props {
		initialHandover: DocumentGenerator.HandoverDocumentRecord;
		unilateral?: boolean;
		extraFields?: import('svelte').Snippet<[{ model: any, errors: any, touch: any }]>;
	}

	let { initialHandover, unilateral = false, extraFields }: Props = $props();

	let handoverProtocol: DocumentGenerator.HandoverDocumentRecord = $state({
		...cleanHandoverProtocol,
		type: 'return'
	} as DocumentGenerator.HandoverDocumentRecord);
	let id: string | undefined = $state();
	let managers: { id: string; name: string; email: string }[] = $state([]);

	const postUrl = $derived(unilateral ? `/handovers/${initialHandover.id}/unilateral/api` : `/handovers/${initialHandover.id}/return/api`);
	const docTitle = $derived(unilateral ? 'Protokół jednostronnego odbioru pojazdu' : 'Protokół zwrotu pojazdu');

	const updateManager = (event: SelectEventDetail<{ id: string; name: string; email: string }>) => {
		handoverProtocol.managerId = event.original.id;
		handoverProtocol.managerName = event.original.name;
		handoverProtocol.managerEmail = event.original.email;
	};

	onMount(async () => {
		handoverProtocol.type = unilateral ? 'unilateral' : 'return';

		const signersList = await fetchHandoverSigners([ 'id', 'name', 'email' ]);
		managers = signersList;

		if (initialHandover) {
			const fieldsToCopy: (keyof DocumentGenerator.HandoverDocumentRecord)[] = [
				'registrationNumber',
				'vin',
				'model',
				'driverId',
				'driverName',
				'driverEmail',
				'identificationDocumentType',
				'identificationDocumentNumber',
				'place',
				'isElectric'
			];

			for (const field of fieldsToCopy) {
				// @ts-expect-error @mixed typing
				if (initialHandover[field] !== undefined) handoverProtocol[field] = initialHandover[field];
			}

			if (initialHandover.locale) handoverProtocol.locale = initialHandover.locale;

			for (const item of equipmentList) {
				handoverProtocol[item.key] = initialHandover[item.key];
			}
		}

		if (unilateral) {
			handoverProtocol.witness = '';
			handoverProtocol.reasonForRecovery = '';
			handoverProtocol.foundItems = [];
		}
	});
</script>

<ReturnHandoverProtocolForm bind:handoverProtocol {cleanHandoverProtocol} {postUrl} {unilateral} requiredEquipment={initialHandover} {docTitle} bind:id {extraFields}>
	{#snippet header()}
		<section class="pb-3 mb-3 border-bottom">
			{#if managers.length}
				<SearchBar data={managers} caption="Wybierz menadżera floty" search="name" onselect={(e) => updateManager(e)} />
			{:else}
				<p class="text-muted">Brak dostępnych menedżerów</p>
			{/if}
		</section>
	{/snippet}
</ReturnHandoverProtocolForm>
