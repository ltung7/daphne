<script lang="ts">
	import PageTitle from '$lib/misc/PageTitle.svelte';
	import IconLink from '$lib/misc/IconLink.svelte';
	import SectionCard from '$lib/misc/SectionCard.svelte';
</script>

<PageTitle title="Rozliczenia tygodniowe" subtitle="Import z platform Uber i Bolt">
	<IconLink icon="add" caption="Dodaj nowe rozliczenie" href="/weeklyingestations/new" />
</PageTitle>

<SectionCard title="Informacja">
	<p class="text-muted mb-0">
		Rozliczenia tygodniowe wprowadzane ręcznie (API zablokowane/odroczone). 
		Przejdź do formularza dodawania aby przypisać zyski i potrącić prowizje.
	</p>
</SectionCard>