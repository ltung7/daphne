<script lang="ts">
	import { onMount, type Snippet } from "svelte";

	interface Props {
		/** Specify the input value */
		value?: string;
		/** Set to `true` to auto focus the input on mount */
		autofocus?: boolean;
		/** Specify the debounce value in milliseconds (ms) */
		debounce?: number;
		/** Specify the input label text */
		label?: string;
		/** Set to `true` to visually hide the label */
		hideLabel?: boolean;
		/** Specify an `id` for the `input` */
		id?: string;
		/** Obtain a reference to the `input` element */
		ref?: HTMLInputElement | null;
		/** Set to `true` to omit the form `role="search"` attribute */
		removeFormAriaAttributes?: boolean;
		/** Callback when typing occurs */
		ontype?: (value: string) => void;
		/** Callback when input is cleared */
		onclear?: () => void;
		/** Custom snippet for label replacement */
		labelSnippet?: Snippet;
		[key: string]: any;
	}

	let {
		value = $bindable(""),
		autofocus = false,
		debounce = 0,
		label = "Label",
		hideLabel = false,
		id = "search" + Math.random().toString(36),
		ref = $bindable(null),
		removeFormAriaAttributes = false,
		ontype,
		onclear,
		labelSnippet,
		...restProps
	}: Props = $props();

	let prevValue = value;
	let timeout: ReturnType<typeof setTimeout> | undefined;

	onMount(() => {
		if (autofocus && ref) {
			window.requestAnimationFrame(() => ref?.focus());
		}
		return () => clearTimeout(timeout);
	});

	$effect(() => {
		const currentValue = value;

		if (currentValue !== prevValue) {
			if (prevValue.length > 0 && currentValue.length === 0) {
				ontype?.(currentValue);
				onclear?.();
			} else if (debounce > 0) {
				clearTimeout(timeout);
				timeout = setTimeout(() => {
					ontype?.(currentValue);
				}, debounce);
			} else {
				ontype?.(currentValue);
			}

			prevValue = currentValue;
		}
	});
</script>

<form
	data-svelte-search
	role={removeFormAriaAttributes ? undefined : "search"}
	aria-labelledby={removeFormAriaAttributes ? undefined : id}
	action=""
	onsubmit={(e) => e.preventDefault()}
>
	<label
		id="{id}-label"
		for={id}
		style={hideLabel
			? "position: absolute;height: 1px;width: 1px;overflow: hidden;clip: rect(1px 1px 1px 1px);clip: rect(1px, 1px, 1px, 1px);white-space: nowrap;"
			: undefined}
	>
		{#if labelSnippet}
			{@render labelSnippet()}
		{:else}
			{label}
		{/if}
	</label>

	<input
		bind:this={ref}
		name="search"
		type="search"
		placeholder="Search..."
		autocomplete="off"
		spellcheck="false"
		{id}
		bind:value
		{...restProps}
	/>
</form>