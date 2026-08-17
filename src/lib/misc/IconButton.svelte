<script lang="ts">
    import UIcon from "$lib/misc/UIcon.svelte";
	import { untrack } from "svelte";
	import type { MouseEventHandler } from "svelte/elements";
    
    interface Props {
        class?: string;
        color?: string;
        outline?: boolean;
        size?: number;
        disabled?: boolean;
        icon?: string;
        caption?: string;
        active?: boolean;
        onclick?: MouseEventHandler<HTMLButtonElement>;
    }

    let {
        class: className = $bindable('mb-0'),
        color = 'primary',
        outline = false,
        size = 4,
        disabled = false,
        icon = 'play',
        caption = "Button",
        active = false,
        onclick
    }: Props = $props();
    
    const isOutline = untrack(() => outline);
    const sizeValue = untrack(() => size);
    const colorValue = untrack(() => color);

    if (isOutline) {
        className += ' btn-outline-' + colorValue;
    } else {
        className += ' btn-' + colorValue;
    }

    if (sizeValue >= 6) className += ' btn-sm';
    else if (sizeValue <= 2) className += ' btn-lg';
</script>

<button class="d-flex align-items-center btn {className}" {disabled} class:active {onclick}>
    <UIcon name={icon} {size} color={outline && !active ? color : 'inherit'} gradient />
    <span class="fs-{size+2} ms-2">{caption}</span>
</button>