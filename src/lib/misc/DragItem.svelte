<script lang="ts">
	import { getContext } from "svelte";
    const fn = getContext('dragContainerFunctions') as { dragStart: SvelteCustom.DragBoxStart, dragEnd: SvelteCustom.DragBoxEnd };
    const current = getContext('dragBoxIndex') as string;

    interface Props {
        index: string;
        class?: string;
        draggable?: boolean;
        children?: import('svelte').Snippet;
        onClick?: (_e: Event) => void;
    }

    let {
        index,
        class: addClass = 'badge bg-primary',
        draggable = true,
        children,
        onClick
    }: Props = $props();
    
</script>

<button class="btn-clear p-0 drag-item {addClass}" {draggable} ondragstart={fn.dragStart(index, current)} ondragend={fn.dragEnd} onclick={onClick}>
    {@render children?.()}
</button>
