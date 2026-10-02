<script lang="ts">
	import { onMount } from 'svelte';
	import PageTitle from '$lib/misc/PageTitle.svelte';
	import ClosableModal from '$lib/misc/ClosableModal.svelte';
	import WeeklyIngestionForm from '$lib/components/finance/WeeklyIngestionForm.svelte';
	import type { WeeklyIngestionFormData } from '$lib/types/weeklyIngestation';

	const getCleanItem = (): WeeklyIngestionFormData => ({
		period: '',
		week: '',
		platform: 'bolt',
		provisionRate: 0.12,
		driverEntries: []
	});

	let item: WeeklyIngestionFormData = $state(getCleanItem());
	let showCreated = $state(false);
	let processedCount = $state(0);

	const onResponse = async (response: any) => {
		if (response.success) {
			processedCount = response.processedDrivers || 0;
			showCreated = true;
		}
	};

	const onReset = () => {
		item = getCleanItem();
	};

	onMount(() => {
		setTimeout(onReset, 0);
	});
</script>

<PageTitle 
	title="Nowe rozliczenie tygodniowe" 
	subtitle="Ręczne wprowadzanie danych o przychodach z platform" 
/>

<WeeklyIngestionForm bind:item {onResponse} {onReset} />

<ClosableModal bind:isOpen={showCreated} headerText="Rozliczenie zapisane" buttonCaption="OK" onClick={() => {
	showCreated = false;
	onReset();
}} centered>
	<div class="text-center">
		<h5 class="text-success">Rozliczenie zostało pomyślnie przetworzone</h5>
		<p>Przetworzono rozliczenia dla {processedCount} kierowców.</p>
	</div>
</ClosableModal>