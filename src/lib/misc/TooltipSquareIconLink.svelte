<script lang="ts">
    type TooltipPlacement = 'left' | 'top' | 'bottom' | 'right';

    import TooltipText from "./TooltipText.svelte";
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
        blank?: boolean;
        download?: null|true|string;
        onClick?: () => void;
    }

    let {
        hoverText,
        icon,
        href = $bindable('link'),
        color = 'primary',
        disabled = false,
        size = 3,
        class: className = '',
        placement = "bottom",
        blank = false,
        download = null,
        onClick
    }: Props = $props();
</script>

<TooltipText {hoverText} class="hover-zoom-contents flex-center mx-2 d-inline-flex whs-{size} {className} {disabled ? 'disabled' : ''}" {placement}>
    <a {href} class="flex-center btn-clear" onclick={onClick} role="button" tabindex="0" target="{blank ? '_blank' : '_self'}" {download}>
        <UIcon name={icon} {size} {color} gradient />
    </a>
</TooltipText>