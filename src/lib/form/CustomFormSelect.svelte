<script lang="ts">
	import { untrack } from 'svelte';

	interface Props {
		value?: string;
		list?: Record<string, string>;
		name?: string;
		autoselect?: boolean;
		readonly?: boolean;
		size?: number;
		class?: string;
		caption?: string;
		onchange?: null | ((value: string) => any);
	}

	let { value = $bindable(''), list = {}, name = $bindable(''), autoselect = false, readonly = false, size = 4, onchange, class: className = '', caption }: Props = $props();

	// generate name from caption if not provided
	if (!name) {
		name = 'select_' + Math.random().toString().slice(2);
	}

	// autoselect first option once
	if (untrack(() => autoselect) && !value) {
		const first = Object.keys(untrack(() => list))[0];
		if (first) value = first;
	}

	const handleChange = () => {
		if (onchange) onchange(value);
	};
</script>

{#if caption?.length}
	<label for="select_{name}" class="form-label small mb-1">{caption}</label>
{/if}
<div class="flex-between input-group input-group-outline border-secondary is-filled z-index-3 me-4 mb-3 {className}" class:cursor-pointer={!readonly}>
	<select id="select_{name}" {name} bind:value disabled={readonly} class="form-control fs-{size} text-dark w-100" onchange={handleChange}>
		{#each Object.entries(list) as [ lvalue, lcaption ]}
			<option value={lvalue} disabled={lvalue.length === 0}>
				{@html lcaption}
			</option>
		{/each}
	</select>
</div>

<style>
	select.form-control {
		appearance: auto;
		padding-right: 2rem;
		background-color: transparent;
	}
</style>
