<script lang="ts">
    import UIcon from "$lib/misc/UIcon.svelte";
	import { subRoute } from "$lib/nav/internal";
	import { untrack } from 'svelte';
    interface Props {
    onClick?: () => void;
        class?: string;
        color?: string;
        outline?: boolean;
        size?: number;
        disabled?: boolean;
        icon?: string;
        caption?: string;
        blank?: boolean;
        href?: string;
        download?: string|true|null;
    }

    let {
        class: className = $bindable(''),
        onClick = undefined,
        color = 'primary',
        outline = false,
        size = 4,
        disabled = false,
        icon = 'play',
        caption = "Button",
        blank = false,
        href = $bindable(''),
        download = null
    }: Props = $props();
    
    if (!href.startsWith('http')  && !href.startsWith('/') && !href.includes('.')) {
        href = $subRoute + href;
    }
    
    const sizeValue = untrack(() => size);
    if (sizeValue >= 6) className += ' btn-sm';
    else if (sizeValue <= 2) className += ' btn-lg';
</script>

<a class="d-flex align-items-center btn btn-{outline ? 'outline-' : ''}{color} {className}" class:disabled={disabled} href={href} target={blank ? '_blank' : undefined} rel={blank ? 'external' : undefined} onclick={(e) => { if (disabled) { e.preventDefault(); return; } onClick?.(); }} {download}>
    <UIcon name={icon} {size} gradient color={outline ? color : 'inherit'} />
    <span class="fs-{size+2} ms-2">{caption}</span>
</a>