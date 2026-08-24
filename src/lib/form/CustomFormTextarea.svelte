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
        id?: any;
        readonly?: boolean;
        onInput?: () => void;
        onChange?: () => void;
        error?: string;
		onblur?: () => void;
    }

    let {
        name = $bindable(''),
        value = $bindable(''),
        caption = '',
        size = 2,
        class: addClass = 'my-3',
        noauto = false,
        id = $bindable(undefined),
        readonly = false,
        onInput,
        onChange,
        error,
        onblur
    }: Props = $props();

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
    {#if caption?.length}
        <label for={id} class="form-label small" class:is-focused={isFocused}>{caption}</label>
    {/if}
    <textarea bind:value class="form-control" rows={size} {id} {name} onfocus={onFocus} onblur={onBlur} autocomplete={noauto ? 'off' : ''} {readonly} oninput={onInput} onchange={onChange}></textarea>
    {#if error}<div class="xsmall text-danger" transition:slide>{error}</div>{/if}
</div>