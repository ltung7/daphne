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
        onClick?: (_e: Event) => void;
    }

    let {
        hoverText,
        icon,
        href = $bindable(),
        color = 'primary',
        disabled = false,
        size = 3,
        class: className = '',
        placement = "bottom",
        onClick
    }: Props = $props();
    
    const type = href ? 'a' : 'button';
    if (href) href = $subRoute + href;
</script>

<TooltipText {hoverText} class="hover-zoom-contents flex-center mx-2 d-inline-flex whs-{size} {className} {disabled ? 'disabled' : ''}" {placement}>
    <svelte:element this={type} {href}  class="flex-center btn-clear" onclick={onClick} role="button" tabindex="-1" {disabled} title={hoverText}>
        <UIcon name={icon} {size} {color} gradient />
    </svelte:element>
</TooltipText>