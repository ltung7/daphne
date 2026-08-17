<script module>
	export type ResultItem<T> = {
		original: T;
		index: number;
		score: number;
		string: string;
		disabled?: boolean;
	};

	export type SelectEventDetail<T> = {
		selectedIndex: number;
		searched: string;
		selected: any;
		original: T;
		originalIndex: number;
	};
</script>

<script lang="ts" generics="TItem = string | number | Record<string, any>">
	import { tick, type Snippet } from 'svelte';
	import fuzzy from 'fuzzy';
	import Search from './Search.svelte';

	interface Props {
		id?: string;
		value?: string;
		data?: TItem[];
		extract?: (item: TItem) => any;
		disable?: (item: TItem) => boolean;
		filter?: (item: TItem) => boolean;
		autoselect?: boolean;
		inputAfterSelect?: 'update' | 'clear' | 'keep';
		focusAfterSelect?: boolean;
		showDropdownOnFocus?: boolean;
		showAllResultsOnFocus?: boolean;
		limit?: number;
		results?: ResultItem<TItem>[]; // Exported bindable prop
		onselect?: (detail: SelectEventDetail<TItem>) => void;
		onfocus?: (e: FocusEvent) => void;
		children?: Snippet<[{ result: ResultItem<TItem>; index: number; value: string }]>;
		noResults?: Snippet<[{ value: string }]>;
		[key: string]: any;
	}

	let {
		id = 'typeahead-' + Math.random().toString(36),
		value = $bindable(''),
		results = $bindable([]), // <-- Now bindable by parent
		data = [],
		extract = (item: TItem) => item,
		disable = (_item: TItem) => false,
		filter = (_item: TItem) => false,
		autoselect = true,
		inputAfterSelect = 'update',
		focusAfterSelect = false,
		showDropdownOnFocus = false,
		showAllResultsOnFocus = false,
		limit = Infinity,
		onselect,
		onfocus,
		children,
		noResults,
		...restProps
	}: Props = $props();

	let comboboxRef = $state<HTMLDivElement | null>(null);
	let searchRef = $state<HTMLInputElement | null>(null);
	let hideDropdown = $state(false);
	let selectedIndex = $state(-1);
	let prevResults = $state('');
	let isFocused = $state(false);

	const options = $derived({ pre: '<mark>', post: '</mark>', extract });

	// Compute results internally
	const calculatedResults: ResultItem<TItem>[] = $derived.by(() => {
		if (isFocused && showAllResultsOnFocus && value.length === 0) {
			return data
				.filter((datum) => !filter(datum))
				.map((original, index) => ({
					disabled: disable(original),
					index,
					original,
					score: 0,
					string: String(extract(original) ?? '')
				}));
		}

		return (
			fuzzy.filter(value, data, options) as Array<{
				score: number;
				string: string;
				original: TItem;
				index: number;
			}>
		)
			.filter(({ score }) => score > 0)
			.slice(0, limit)
			.filter((result) => !filter(result.original))
			.map((result) => ({ ...result, disabled: disable(result.original) }));
	});

	// Sync calculated results to the $bindable prop
	$effect(() => {
		results = calculatedResults;
	});

	const resultsId = $derived(results.map((result) => extract(result.original)).join(''));

	const showResults = $derived.by(() => {
		let show = !hideDropdown && results.length > 0;
		if (showDropdownOnFocus) {
			show = show && isFocused;
		}
		return show;
	});

	$effect(() => {
		const currentResultsId = resultsId;
		if (prevResults !== currentResultsId) {
			if (autoselect) {
				selectedIndex = getNextNonDisabledIndex();
			}

			if (!noResults && results.length === 0) {
				hideDropdown = true;
			} else if (isFocused && results.length > 0) {
				hideDropdown = false; // Only reveal on result change IF user is focused
			}

			prevResults = currentResultsId;
		}
	});

	async function select() {
		const result = results[selectedIndex];
		if (!result || result.disabled) return;

		const selectedValue = extract(result.original);
		const searchedValue = value;

		if (inputAfterSelect === 'clear') value = '';
		if (inputAfterSelect === 'update') value = String(selectedValue ?? '');

		onselect?.({
			selectedIndex,
			searched: searchedValue,
			selected: selectedValue,
			original: result.original,
			originalIndex: result.index
		});

		await tick();

		if (focusAfterSelect && searchRef) searchRef.focus();
		close();
	}

	function getNextNonDisabledIndex(): number {
		let index = 0;
		let disabled = results[index]?.disabled ?? false;

		while (disabled) {
			if (index >= results.length) {
				index = 0;
			} else {
				index += 1;
			}
			disabled = results[index]?.disabled ?? false;
		}

		return index;
	}

	function change(direction: -1 | 1) {
		let index = direction === 1 && selectedIndex === results.length - 1 ? 0 : selectedIndex + direction;
		if (index < 0) index = results.length - 1;

		let disabled = results[index]?.disabled ?? false;

		while (disabled) {
			if (index >= results.length) {
				index = 0;
			} else {
				index += direction;
			}
			disabled = results[index]?.disabled ?? false;
		}

		selectedIndex = index;
	}

	const open = () => (hideDropdown = false);
	const close = () => {
		hideDropdown = true;
		isFocused = false;
	};
</script>

<svelte:window
	onclick={({ target }) => {
		if (!hideDropdown && !comboboxRef?.contains(target as Node)) {
			close();
		}
	}}
/>

<div data-svelte-typeahead bind:this={comboboxRef} role="combobox" aria-haspopup="listbox" aria-controls="{id}-listbox" class:dropdown={results.length > 0} aria-expanded={showResults} id="{id}-typeahead">
	<Search
		{id}
		removeFormAriaAttributes={true}
		{...restProps}
		bind:ref={searchRef}
		aria-autocomplete="list"
		aria-controls="{id}-listbox"
		aria-labelledby="{id}-label"
		aria-activedescendant={selectedIndex >= 0 && !hideDropdown && results.length > 0 ? `${id}-result-${selectedIndex}` : null}
		bind:value
		onfocus={(e: FocusEvent) => {
			isFocused = true;
			open();
			onfocus?.(e);
		}}
		oninput={() => {
			isFocused = true;
			open();
		}}
		onclear={open}
		onblur={(e: FocusEvent) => {
			const relatedTarget = e.relatedTarget as HTMLElement;
			if (relatedTarget && comboboxRef?.contains(relatedTarget)) {
				return;
			}
			close();
		}}
		onkeydown={(e: KeyboardEvent) => {
			if (results.length === 0) return;

			switch (e.key) {
				case 'Enter':
					select();
					break;
				case 'ArrowDown':
					e.preventDefault();
					change(1);
					break;
				case 'ArrowUp':
					e.preventDefault();
					change(-1);
					break;
				case 'Escape':
					e.preventDefault();
					value = '';
					searchRef?.focus();
					close();
					break;
			}
		}}
	/>

	<ul class="svelte-typeahead-list" role="listbox" aria-labelledby="{id}-label" id="{id}-listbox">
		{#if showResults}
			{#each results as result, index}
				<li
					role="option"
					id="{id}-result-{index}"
					class:selected={selectedIndex === index}
					class:disabled={result.disabled}
					aria-selected={selectedIndex === index}
					onmousedown={(e) => {
						if (result.disabled) return;
						e.preventDefault();
						selectedIndex = index;
						select();
					}}
					onmouseenter={() => {
						if (result.disabled) return;
						selectedIndex = index;
					}}
				>
					{#if children}
						{@render children({ result, index, value })}
					{:else}
						{@html result.string}
					{/if}
				</li>
			{/each}
		{/if}

		{#if noResults && !hideDropdown && value.length > 0 && results.length === 0}
			<div class="no-results">
				{@render noResults({ value })}
			</div>
		{/if}
	</ul>
</div>

<style>
	[data-svelte-typeahead] {
		position: relative;
		background-color: #fff;
	}

	ul {
		position: absolute;
		top: 100%;
		left: 0;
		width: 100%;
		margin: 0;
		padding: 0;
		list-style: none;
		background-color: inherit;
		box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
	}

	[aria-expanded='true'] ul {
		z-index: 6;
	}

	li,
	.no-results {
		padding: 0.25rem 1rem;
	}

	li {
		cursor: pointer;
	}

	li:not(:last-of-type) {
		border-bottom: 1px solid #e0e0e0;
	}

	li:hover {
		background-color: #e5e5e5;
	}

	.selected {
		background-color: #e5e5e5;
	}

	.selected:hover {
		background-color: #cacaca;
	}

	.disabled {
		opacity: 0.4;
		cursor: not-allowed;
	}

	:global([data-svelte-search] label) {
		margin-bottom: 0.25rem;
		display: inline-flex;
		font-size: 0.875rem;
	}

	:global([data-svelte-search] input) {
		width: 100%;
		padding: 0.5rem 0.75rem;
		background: none;
		font-size: 1rem;
		border: 0;
		border-radius: 0;
		border: 1px solid #e5e5e5;
	}

	:global([data-svelte-search] input:focus) {
		outline-color: var(--bs-primary);
		outline-offset: 2px;
		outline-width: 1px;
	}
</style>
