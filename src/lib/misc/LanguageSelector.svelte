<script>
	import { Dropdown, DropdownToggle, DropdownMenu, DropdownItem } from '@sveltestrap/sveltestrap';
	import { getLocale, setLocale, locales } from '$lib/paraglide/runtime.js';
	import Flag from '$lib/misc/Flag.svelte';
	import UIcon from './UIcon.svelte';

	// Svelte 5 runes: local UI state + reactive "current" locale
	let isOpen = $state(false);
	let currentLocale = $derived(getLocale());

	function toggle() {
		isOpen = !isOpen;
	}

	function selectLocale(locale) {
		if (locale === currentLocale) {
			isOpen = false;
			return;
		}
		setLocale(locale);
		isOpen = false;
	}
</script>

<Dropdown {isOpen} {toggle}>
	<DropdownToggle class="d-flex align-items-center gap-2 flex-between p-1" color="dark" outline size="sm">
		<Flag country={currentLocale} size={3} />
		<span class="text-uppercase">{currentLocale}</span>
		<UIcon name="caret-circle-down" />
	</DropdownToggle>

	<DropdownMenu end>
		{#each locales as locale (locale)}
			<DropdownItem active={locale === currentLocale} class="d-flex align-items-center gap-2" on:click={() => selectLocale(locale)}>
				<Flag country={locale} size={1.5} />
				<span class="text-uppercase">{locale}</span>
			</DropdownItem>
		{/each}
	</DropdownMenu>
</Dropdown>
