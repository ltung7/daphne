<script lang="ts">
	import UIcon from '$lib/misc/UIcon.svelte';
	import { browserTranslate } from '$lib/nav/translate';
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
		targetLocale: string;
	}

	let { name = $bindable(''), value = $bindable(''), caption = '', size = 6, placeholder = '', class: addClass = '', noauto = false, id = $bindable(undefined), readonly = false, onInput, onChange, error, onblur,  targetLocale="en" }: Props = $props();

	let isFocused = $state(false);
	const onFocus = () => (isFocused = true);
	const onBlur = () => {
		isFocused = false;
		onblur?.();
	};

	if (!id) {
		if (name.length === 0) {
			name = untrack(() => caption);
			id = 'texty_' + (Math.random() * 900000 + 100000).toFixed(0);
		} else {
			id = 'texty_' + name;
		}
	}

	let effectiveError = $derived(error || (value.length === 0 ? 'Wymaga tłumaczenia' : undefined))

	const handleTranslate = async () => {
		const translation = await browserTranslate.chrome(caption, 'pl', targetLocale)
		if (!translation?.length) return;
		value = translation;
		onChange?.();
	}
</script>

<div class="mb-3 {addClass}">
	{#if caption}
		<label for={id} class="form-label small mb-1" class:is-focused={isFocused}>{caption}</label>
	{/if}
	<div class="input-group">
		<input bind:value type="text" class="form-control border-dark border-end fs-{size}" {id} {name} onfocus={onFocus} onblur={onBlur} autocomplete={noauto ? 'off' : ''} {readonly} oninput={onInput} onchange={onChange} {placeholder} />
		<button class="btn btn-outline-primary border-dark mb-0 border-start py-1" type="button" onclick={handleTranslate}>
			<UIcon name="translate" size={3} />
		</button>
	</div>
	{#if effectiveError}<div class="xsmall text-danger" transition:slide>{effectiveError}</div>{/if}
</div>
