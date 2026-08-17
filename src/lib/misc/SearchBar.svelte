<script lang="ts" generics="T">
	import Typeahead, { type ResultItem, type SelectEventDetail } from './Typeahead.svelte';
	import UIcon from '$lib/misc/UIcon.svelte';

	interface Props {
		data?: T[];
		search?: keyof T;
		results?: ResultItem<T>[];
		placeholder?: string;
		hideDroprown?: boolean;
		value?: string;
		caption?: string;
		inputAfterSelect?: 'update' | 'clear' | 'keep';
		onResults?: (results: ResultItem<T>[]) => void;
		onselect?: (detail: SelectEventDetail<T>) => void;
		onfocus?: (e: FocusEvent) => void;
		extract?: (item: T) => any;
	}

	let { data = [], caption, onselect, onfocus, search = 'search' as keyof T, results = $bindable([]), placeholder = 'Szukaj', hideDroprown = false, value = $bindable(''), inputAfterSelect = 'update', onResults, extract = (item: T) => item[search] }: Props = $props();

	let prevResults: ResultItem<T>[] = [];

	function handleChange() {
		if (results !== prevResults) {
			prevResults = results;
			onResults?.(results);
		}
	}
</script>

<div class="w-100 searchBar mb-2 text-dark">
	{#if caption}
		<label class="d-print-none" style="margin-left: 70px" for="typeahead-{Math.random().toString().slice(2)}">{caption}</label>
	{/if}
	<div class="position-relative">
		<div class="ms-4" class:hideDroprown={hideDroprown || data.length === 0}>
			<Typeahead {data} {extract} {placeholder} {inputAfterSelect} bind:value bind:results {onselect} {onfocus} oninput={handleChange} onchange={handleChange} showDropdownOnFocus>
				{#snippet noResults()}
					No results
				{/snippet}
			</Typeahead>
		</div>
		<div class="bg-dark position-absolute top-0 start-0 mt-n2 ms-n2 d-flex justify-content-center align-items-center" style="border-radius: 50%; width: 60px; height: 60px;">
			<UIcon name="search" size={4} color="white" />
		</div>
	</div>
</div>
