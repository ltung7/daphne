<script lang="ts">
	import { untrack } from "svelte";

    interface Props {
        name?: string;
        value?: number;
        caption?: string;
        size?: number;
        class?: string;
        min?: number;
        max?: number;
        decimal?: boolean;
        readonly?: boolean;
        fullwidth?: boolean;
		onChange?: null | ((value: number) => any);
        id?: any;
    }

    let {
        name = $bindable(''),
        value = $bindable(0),
        caption = '',
        size = 4,
        class: addClass = '',
        min = 0,
        max = 99999,
        decimal = false,
        readonly = false,
        fullwidth = false,
        id = $bindable(null),
        onChange
    }: Props = $props();
    
    if (!id) id = 'input_numeric_' + Math.random();
    let isFocused = $state(false);
    const onFocus =()=>isFocused=true;
	const onBlur =()=>isFocused=false;
    const step = untrack(() => decimal ? 0.01 : 1);
    const precision = untrack(() => decimal ? 2 : 0);

    if (name.length === 0) name = untrack(() => caption);

    const dispatchChange = () => {
        if (onChange) onChange(value)
    };
</script>

<div class="btn-group" class:w-100={fullwidth}>
    <button class="btn btn-outline-secondary fs-{size} my-{7 - size} p-{8 - size}" type="button" onclick={() => { value = Number(Math.max(min, value - step).toFixed(precision)); dispatchChange(); }} disabled={readonly}>-</button>
    <div class="input-group input-group-outline my-{7 - size} {addClass} {(value ?? '0').toString().length ? 'is-filled' : ''} {isFocused ? 'is-focused' : ''}">
        {#if caption?.length}
            <label class="form-label fs-{size + 2} form-label-numeric" class:readonly class:empty={!caption || caption.length === 0} for={id}>{caption}</label>
        {/if}
        <input type="number" {min} {max} {step} class="form-control fs-{size} text-center form-input-numeric p-{8 - size}" bind:value={value} {id} name={name} onfocus={onFocus} onblur={onBlur} {readonly} onchange={dispatchChange} oninput={dispatchChange}>
    </div>
    <button class="btn btn-outline-secondary fs-{size} my-{7 - size} p-{8 - size}" type="button" onclick={() => { value = Number(Math.min(max, value + step).toFixed(precision)); dispatchChange(); }} disabled={readonly}>+</button>
</div>