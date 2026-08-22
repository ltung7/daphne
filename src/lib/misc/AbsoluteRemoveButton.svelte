<script lang="ts">
	import TooltipSquareIconButton from "./TooltipSquareIconButton.svelte";

	interface Props {
		color?: string;
		size?: number;
		onclick?: (event: Event) => void;
	}

	let { color = 'danger', size = 6, onclick }: Props = $props();
</script>

<div class="position-absolute end-0 top-0">
	<TooltipSquareIconButton icon="cross-circle" hoverText="Usuń" {color} {size} onClick={onclick} />
</div>