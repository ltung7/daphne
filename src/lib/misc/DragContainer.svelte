<script lang="ts">
	import { setContext } from 'svelte';

	interface Props {
		dragStarted?: boolean;
		class?: string;
		children?: import('svelte').Snippet;
		moveBetweenArrays: SvelteCustom.DragMoveBetweenArrays<any>;
	}

	let { dragStarted = $bindable(false), moveBetweenArrays = $bindable(), children, class: addClass = '' }: Props = $props();
	let dragHoverItem, dragHover;

	const dragStart: SvelteCustom.DragBoxStart = (item, from) => (event) => {
		const dt = event.dataTransfer as DataTransfer;
		dt.setData('text/plain', item);
		dt.setData('source', from);
		dragHoverItem = item;
		dragStarted = true;
	};

	const dragEnd: SvelteCustom.DragBoxEnd = () => {
		dragHoverItem = false;
		dragStarted = false;
	};

	moveBetweenArrays = (item, indexFrom, indexTo, arrays, itemIndex) => {
		if (itemIndex) {
			const isString = typeof item === 'string';
			const foundItem = arrays[indexFrom].find((element) => (isString ? element[itemIndex] === item : element[itemIndex] === item[itemIndex]));
			if (foundItem) {
				arrays[indexFrom] = arrays[indexFrom].filter((element) => (element[itemIndex] !== foundItem[itemIndex]));
				arrays[indexTo].push(foundItem);
			}
		} else {
			arrays[indexFrom] = arrays[indexFrom].filter((element) => element !== item);
			arrays[indexTo].push(item);
		}
		return arrays;
	};

	setContext('dragContainerFunctions', { dragStart, dragEnd, dragHoverItem, dragStarted, dragHover });
</script>

<div class:dragStarted class={addClass}>
	{@render children?.()}
</div>
