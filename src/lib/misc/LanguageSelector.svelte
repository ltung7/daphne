<script lang="ts">
	import { Dropdown, DropdownToggle, DropdownMenu, DropdownItem } from '@sveltestrap/sveltestrap';
	import { getLocale, setLocale } from '$lib/paraglide/runtime.js';
	import Flag from '$lib/misc/Flag.svelte';
	import UIcon from './UIcon.svelte';
	import { languages } from '$lib/assets/constants';
	import { layoutState } from '$lib/nav/stores.svelte';

	const flags = languages.reduce((obj, item) => { obj[item[0]] = item[1]; return obj }, {} as Record<string, string>)

	// Svelte 5 runes: local UI state + reactive "current" locale
	let isOpen = $state(false);
	let currentLocale: App.Locale = $state(getLocale());
	let country = $derived(flags[currentLocale] ?? 'unknown')

	function toggle() {
		isOpen = !isOpen;
	}

	function selectLocale(locale: App.Locale) {
		if (locale === layoutState.currentLocale) {
			return;
		}
		currentLocale = locale;
		layoutState.currentLocale = locale;
		setLocale(locale, { reload: false });
	}
</script>

<Dropdown {isOpen} {toggle}>
	<DropdownToggle class="d-flex align-items-center gap-2 flex-between p-1" color="dark" outline size="sm">
		<Flag {country} size={3} />
		<span class="text-uppercase">{currentLocale}</span>
		<UIcon name="caret-circle-down" />
	</DropdownToggle>

	<DropdownMenu end>
		{#each languages as [ locale, country, plText, text ] (locale)}
			<DropdownItem active={locale === layoutState.currentLocale} class="d-flex align-items-center gap-2 py-1" on:click={() => selectLocale(locale)}>
				<Flag {country} size={2} />
				<span class="small">{text} ({plText})</span>
			</DropdownItem>
		{/each}
	</DropdownMenu>
</Dropdown>

<!-- <script lang="ts">
	const LANGUAGES: Record<Locale, string> = {
		en: '<img src="https://storage.googleapis.com/feed-cdn-files/flags/en.svg" alt="English" title="English" style="height: 21px; width: 28px;" class="flag border rounded" width="28" height="21"> English',
		pl: '<img src="https://storage.googleapis.com/feed-cdn-files/flags/pl.svg" alt="Polski" title="Polski" style="height: 21px; width: 28px;" class="flag border rounded" width="28" height="21"> Polski',
		hi: '<img src="https://storage.googleapis.com/feed-cdn-files/flags/in.svg" alt="Hindi" title="Hindi" style="height: 21px; width: 28px;" class="flag border rounded" width="28" height="21"> हिन्दी',
		ne: '<img src="https://storage.googleapis.com/feed-cdn-files/flags/ne.svg" alt="Nepali" title="Nepali" style="height: 21px; width: 28px;" class="flag border rounded" width="28" height="21"> नेपाली',
		uk: '<img src="https://storage.googleapis.com/feed-cdn-files/flags/ua.svg" alt="Ukrainian" title="Ukrainian" style="height: 21px; width: 28px;" class="flag border rounded" width="28" height="21"> Українська',
		tl: '<img src="https://storage.googleapis.com/feed-cdn-files/flags/ph.svg" alt="Filipino" title="Filipino" style="height: 21px; width: 28px;" class="flag border rounded" width="28" height="21"> Filipino',
		fr: '<img src="https://storage.googleapis.com/feed-cdn-files/flags/fr.svg" alt="Française" title="Française" style="height: 21px; width: 28px;" class="flag border rounded" width="28" height="21"> Française',
		hr: '<img src="https://storage.googleapis.com/feed-cdn-files/flags/hr.svg" alt="Hrvatski" title="Hrvatski" style="height: 21px; width: 28px;" class="flag border rounded" width="28" height="21"> Hrvatski'
	};

	// import { currentLocale } from "$lib/nav/stores";
	import type { Locale } from '$lib/paraglide/runtime';
	import { getLocale, setLocale } from '$lib/paraglide/runtime';
	import CustomDropdown from './CustomDropdown.svelte';

	const selected: Locale = getLocale();

	const handleSelectLocale = (selected: Locale) => {
		setLocale(selected, { reload: false });
		// $currentLocale = selected;
	};
</script>

<CustomDropdown list={LANGUAGES} {selected} onchange={handleSelectLocale} /> -->
