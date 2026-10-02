<script lang="ts">
    import UIcon from '$lib/misc/UIcon.svelte';
    import type { CustomConfigNode } from '$lib/types/settings';

    interface Props {
        item: CustomConfigNode;
        categoryCaption: string;
        onclick?: () => void;
    }

    let { item, categoryCaption, onclick }: Props = $props();

    const scrollToSetting = () => {
        const el = document.getElementById(`setting-${item.node}`);
        if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            el.classList.add('bg-light');
            setTimeout(() => el.classList.remove('bg-light'), 1500);
        }
        onclick?.();
    };
</script>

<button
    type="button"
    class="list-group-item list-group-item-action text-start p-2 border-0 rounded mb-1"
    onclick={scrollToSetting}
>
    <div class="d-flex align-items-center justify-content-between">
        <span class="fw-bold text-xs text-dark text-truncate">{item.caption}</span>
        <span class="badge bg-light text-secondary text-xxs">{categoryCaption}</span>
    </div>
    {#if item.description}
        <div class="text-xxs text-muted text-truncate mt-1">{@html item.description}</div>
    {/if}
</button>
