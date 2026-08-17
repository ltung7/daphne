<script lang="ts">
	import { getContext, setContext, untrack } from 'svelte';
	interface Props {
		drop: SvelteCustom.DragBoxDrop;
		checkDroppable?: SvelteCustom.DragBoxCheckDroppable;
		index?: any;
		class?: string;
		undroppable?: boolean;
		children?: import('svelte').Snippet;
	}

	let { drop, checkDroppable = $bindable(false), index = Math.random().toString(), class: addClass = 'flex-center flex-wrap', undroppable = false, children }: Props = $props();

	let { dragHover } = $state(getContext('dragContainerFunctions') as { dragHover: string | null });
	const { dragEnd } = getContext('dragContainerFunctions') as { dragEnd: SvelteCustom.DragBoxEnd };

	const dragLeave = () => {
		dragHover = null;
	};
	const dragEnter = () => {
		dragHover = index;
	};
	const dragOver = (event: DragEvent) => {
		let droppable = true;
		if (checkDroppable) droppable = checkDroppable();
		if (!droppable) {
			return false;
		}
		event.preventDefault();
		return true;
	};

	const dragDrop = (event: DragEvent) => {
		if (!event.dataTransfer) return;
		const dragHoverItem = event.dataTransfer.getData('text/plain');
		const from = event.dataTransfer.getData('source');
		if (drop) drop(event, index, dragHoverItem, from);
		dragHover = null;
		dragEnd();
	};

	untrack(() => {
		if (undroppable) checkDroppable = () => false;
		setContext('dragBoxIndex', index);
	});
</script>

<div id={index} role="group" class="dragBox {addClass}" class:dragHover={dragHover === index} ondragleave={dragLeave} ondragenter={dragEnter} ondragover={dragOver} ondrop={dragDrop}>
	{@render children?.()}
</div>
