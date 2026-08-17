<script lang="ts">
    import { createBubbler } from 'svelte/legacy';

    const bubble = createBubbler();
	import { getContext } from "svelte";
    
    
    interface Props {
        index: string;
        content: string;
        class?: string;
        draggable?: boolean;
        drop: SvelteCustom.DragBoxDrop;
        children?: import('svelte').Snippet;
    }

    let {
        index,
        content,
        class: addClass = 'badge bg-primary',
        draggable = true,
        drop,
        children
    }: Props = $props();

    const fn = getContext('dragContainerFunctions') as { dragStart: SvelteCustom.DragBoxStart, dragEnd: SvelteCustom.DragBoxEnd };
    const current = getContext('dragBoxIndex') as string;
    let { dragHover } = $state(getContext('dragContainerFunctions') as { dragHover: string|null });
    const { dragEnd } = getContext('dragContainerFunctions') as { dragEnd: SvelteCustom.DragBoxEnd };

    const dragLeave = () => { dragHover = null };
    const dragEnter = () => { dragHover = index };
    const dragOver = (event: DragEvent) => { 
        event.preventDefault(); 
        return true;
    };

    const dragDrop = (event: DragEvent) => {
        if (!event.dataTransfer) return;
        const dragHoverItem = event.dataTransfer.getData('text/plain')
        const from = event.dataTransfer.getData('source');
        if (drop) drop(event, index, dragHoverItem, from);
        dragHover = null;
        dragEnd();
    };
</script>

<button class="btn-clear p-0 drag-item {addClass}" class:dragHover={dragHover === index} {draggable} ondragleave={dragLeave} ondragenter={dragEnter} ondragstart={fn.dragStart(content, current)} ondragend={fn.dragEnd} ondrop={dragDrop} ondragover={dragOver} onclick={bubble('click')}>
    {@render children?.()}
</button>
