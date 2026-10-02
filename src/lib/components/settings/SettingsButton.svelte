<script lang="ts">
    import UIcon from '$lib/misc/UIcon.svelte';
    import type { CustomConfigNode } from '$lib/types/settings';

    interface Props {
        item: CustomConfigNode;
        disabled?: boolean;
    }

    let { item, disabled = false }: Props = $props();

    const handleClick = () => {
        if (!disabled && item.action) {
            item.action();
        }
    };
</script>

<div class="d-flex align-items-center justify-content-between py-2 px-1">
    <div class="pe-3 flex-grow-1">
        <div class="fw-bold d-flex align-items-center gap-2 text-dark">
            {#if item.icon}
                <UIcon name={item.icon} size={5} />
            {/if}
            <span>{item.caption}</span>
        </div>
        {#if item.description}
            <div class="text-xs text-muted mt-1">{@html item.description}</div>
        {/if}
    </div>
    
    <div class="settings-controller d-flex align-items-center justify-content-end" style="width: 240px; min-width: 240px;">
        {#if item.type === 'link' && item.link}
            <a href={item.link} class="btn btn-sm btn-outline-primary mb-0 d-inline-flex align-items-center gap-1" class:disabled>
                <span>Otwórz</span>
                <UIcon name="arrow-up-right" size={6} />
            </a>
        {:else}
            <button type="button" class="btn btn-sm btn-outline-primary mb-0" {disabled} onclick={handleClick}>
                {item.caption}
            </button>
        {/if}
    </div>
</div>
