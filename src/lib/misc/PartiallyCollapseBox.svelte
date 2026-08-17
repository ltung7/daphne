<script lang="ts">
	import UIcon from './UIcon.svelte';

    interface Props {
		isOpen?: boolean;
        children?: import('svelte').Snippet;
        initialHeight?: number;
        maxHeight?: number;
	}
	let { 
        isOpen = $bindable(false), 
        children,
        initialHeight = 300,
        maxHeight = 1000
    }: Props = $props();
</script>

<div class="collapsible-box" class:expanded={isOpen}>
	<div class="collapsible-content" style="max-height: {isOpen ? maxHeight : initialHeight}px">
		{@render children?.()}
	</div>
	<div class="table-responsive">
		<button class="collapsible-shadow" onclick={() => (isOpen = !isOpen)}>
			<UIcon name="angle-small-{isOpen ? 'up' : 'down' }" color="dark" />
		</button>
	</div>
</div>

<style>
    .collapsible-box {
		position: relative;
		max-width: 400px;
	}

	/* --- collapsed state --- */
	.collapsible-content {
		overflow: hidden;
		transition: max-height 0.3s ease;
	}

	.collapsible-shadow {
		position: absolute;
		bottom: 0;
		left: 0;
		right: 0;
		height: 40px;
		display: flex;
		align-items: flex-end;
		justify-content: center;
		padding-bottom: 2px;
		background: linear-gradient(to bottom, transparent, white 50%);
		cursor: pointer;
		transition: background 0.3s ease;
        border: none;
        width: 100%;
	}

	/* --- expanded state --- */
	.collapsible-box.expanded .collapsible-content {
		max-height: 1000px; /* large enough to fit anything */
	}

	.collapsible-box.expanded .collapsible-shadow {
		/* still visible, but no longer hides content — just holds the caret */
		background: linear-gradient(to bottom, transparent, white 80%);
		position: relative; /* taken out of overlay, sits below content */
	}
</style>