<script lang="ts">
	import { Dropdown, DropdownToggle, DropdownMenu, DropdownItem } from '@sveltestrap/sveltestrap';
	import Flag from '$lib/misc/Flag.svelte';
	import UIcon from '../misc/UIcon.svelte';
	import { countryNames } from '$lib/assets/constants';

	interface Props {
		onchange?: (locale: string) => void;
		value?: string;
		class?: string;
	}

	let { onchange, value = $bindable('pl'), class: className = 'w-100' }: Props = $props()

	let isOpen = $state(false);

	function toggle() {
		isOpen = !isOpen;
	}

	const setCountry = (countryCode: string) => {
		value = countryCode;
		onchange?.(value);
	}
</script>

<Dropdown {isOpen} {toggle}>
	<DropdownToggle class="d-flex align-items-center gap-2 flex-between p-1 {className}" color="dark" outline size="sm">
		<Flag country={value} size={3} />
		<span class="text-uppercase">{countryNames[value]}</span>
		<UIcon name="caret-circle-down" />
	</DropdownToggle>

	<DropdownMenu end>
		{#each Object.keys(countryNames) as country (country)}
			<DropdownItem active={country === value} class="d-flex align-items-center gap-2" on:click={() => setCountry(country)}>
				<Flag country={country} size={2.5} />
				<span class="text-uppercase">{countryNames[country]}</span>
			</DropdownItem>
		{/each}
	</DropdownMenu>
</Dropdown>
