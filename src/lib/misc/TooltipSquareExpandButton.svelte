<script lang="ts">
    type TooltipPlacement = 'left' | 'top' | 'bottom' | 'right';

    import TooltipText from "./TooltipText.svelte";
	import { subRoute } from "$lib/nav/internal";
	import UIcon from "./UIcon.svelte";
    interface Props {
        hoverText: string;
        icon: string;
        href?: string;
        color?: string;
        disabled?: boolean;
        size?: number;
        class?: string;
        placement?: TooltipPlacement;
        expanded?: boolean;
        onClick?: () => void;
    }

    let {
        hoverText,
        icon,
        href = $bindable(),
        expanded = $bindable(false),
        color = 'primary',
        disabled = false,
        size = 3,
        class: className = '',
        placement = "bottom",
        onClick
    }: Props = $props();

    const toggle = () => {
        expanded = !expanded;
        if (onClick) onClick()
    }
    
    const type = href ? 'a' : 'button';
    if (href) href = $subRoute + href;
</script>

<TooltipText {hoverText} class="rotatable hover-zoom-contents flex-center mx-2 d-inline-flex whs-{size} {className} {disabled ? 'disabled' : ''} {expanded ? 'expanded' : ''}" {placement}>
    <svelte:element this={type} {href} class="flex-center btn-clear" onclick={toggle} role="button" tabindex="-1" {disabled} title={hoverText}>
        <UIcon name={icon} {size} {color} gradient />
    </svelte:element>
</TooltipText>