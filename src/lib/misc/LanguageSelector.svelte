<script lang="ts">
	import { Dropdown, DropdownToggle, DropdownMenu, DropdownItem } from '@sveltestrap/sveltestrap';
	import { getLocale, setLocale } from '$lib/paraglide/runtime.js';
	import Flag from '$lib/misc/Flag.svelte';
	import UIcon from './UIcon.svelte';
	import { languages } from '$lib/assets/constants';

	interface Props {
		localeState: App.Locale;
	}

	let { localeState = $bindable() }: Props = $props();
	const flags = languages.reduce((obj, item) => { obj[item[0]] = item[1]; return obj }, {} as Record<string, string>)

	// Svelte 5 runes: local UI state + reactive "current" locale
	let isOpen = $state(false);
	let currentLocale = $derived(getLocale());

	function toggle() {
		isOpen = !isOpen;
	}

	function selectLocale(locale: App.Locale) {
		if (locale === currentLocale) {
			return;
		}
		setLocale(locale);
	}
</script>

<Dropdown {isOpen} {toggle}>
	<DropdownToggle class="d-flex align-items-center gap-2 flex-between p-1" color="dark" outline size="sm">
		<Flag country={flags[currentLocale]} size={3} />
		<span class="text-uppercase">{currentLocale}</span>
		<UIcon name="caret-circle-down" />
	</DropdownToggle>

	<DropdownMenu end>
		{#each languages as [ locale, country, plText, text ] (locale)}
			<DropdownItem active={locale === currentLocale} class="d-flex align-items-center gap-2 py-1" on:click={() => selectLocale(locale)}>
				<Flag {country} size={2} />
				<span class="small">{text} ({plText})</span>
			</DropdownItem>
		{/each}
	</DropdownMenu>
</Dropdown>
