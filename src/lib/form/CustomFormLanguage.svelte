<script lang="ts">
	import { Dropdown, DropdownToggle, DropdownMenu, DropdownItem } from '@sveltestrap/sveltestrap';
	import Flag from '$lib/misc/Flag.svelte';
	import UIcon from '../misc/UIcon.svelte';
	import { languages } from '$lib/assets/constants';
	import { onMount } from 'svelte';

	interface Props {
		onchange?: (locale: string) => void;
		value?: string;
		class?: string;
	}

	type LocaleTuple = [ string, string, string, string ];

	let { onchange, value = $bindable('en'), class: className = 'w-100' }: Props = $props()

	let isOpen = $state(false);
	let current: LocaleTuple = $state(languages[0])

	function toggle() {
		isOpen = !isOpen;
	}

	const selectLocale = (locale: LocaleTuple) => {
		current = locale;
		value = locale[0]
		onchange?.(value);
	}

	onMount(() => {
		if (value && value !== current[0]) {
			const found = languages.find(item => item[0] === value);
			if (found) current = found;
		}
		if (!current) current = languages[0];
	})
</script>

<Dropdown {isOpen} {toggle}>
	<DropdownToggle class="d-flex align-items-center gap-2 flex-between p-1 {className}" color="dark" outline size="sm">
		<Flag country={current[1]} size={3} />
		<span class="text-uppercase">{current[2]} / {current[3]}</span>
		<UIcon name="caret-circle-down" />
	</DropdownToggle>

	<DropdownMenu end>
		{#each languages as locale (locale[0])}
			<DropdownItem active={locale[0] === value} class="d-flex align-items-center gap-2" on:click={() => selectLocale(locale)}>
				<Flag country={locale[1]} size={1.5} />
				<span class="text-uppercase">{locale[2]} / {locale[3]}</span>
			</DropdownItem>
		{/each}
	</DropdownMenu>
</Dropdown>
