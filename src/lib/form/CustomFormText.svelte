<script lang="ts">
	import { untrack } from 'svelte';
	import { slide } from 'svelte/transition';

	interface Props {
		name?: string;
		value?: string;
		caption?: string;
		size?: number;
		class?: string;
		noauto?: boolean;
		id?: string;
		readonly?: boolean;
		placeholder?: string;
		onInput?: () => any;
		onChange?: () => any;
		error?: string;
		onblur?: () => void;
	}

	let { name = $bindable(''), value = $bindable(''), caption = '', size = 6, placeholder = '', class: addClass = '', noauto = false, id = $bindable(undefined), readonly = false, onInput, onChange, error, onblur }: Props = $props();

	let isFocused = $state(false);
	const onFocus = () => isFocused = true;
	const onBlur = () => {
        isFocused = false;
        onblur?.()
    };

	if (!id) {
		if (name.length === 0) {
			name = untrack(() => caption);
			id = 'texty_' + (Math.random() * 900000 + 100000).toFixed(0);
		} else {
			id = 'texty_' + name;
		}
	}
</script>

<div class="mb-3 {addClass}">
	{#if caption}
		<label for={id} class="form-label small mb-1" class:is-focused={isFocused}>{caption}</label>
	{/if}
	<input bind:value type="text" class="form-control fs-{size}" {id} {name} onfocus={onFocus} onblur={onBlur} autocomplete={noauto ? 'off' : ''} {readonly} oninput={onInput} onchange={onChange} {placeholder} />
    {#if error}<div class="xsmall text-danger" transition:slide>{error}</div>{/if}
</div>
