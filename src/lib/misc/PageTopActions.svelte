<script lang="ts">
	import type { Snippet } from "svelte";

    interface Props {
		children?: Snippet;
    }

	let { children }: Props = $props();
</script>

<div class="section-card card card-body p-2">
    <div class="d-flex flex-wrap gap-3">
	    {@render children?.()}
    </div>
</div>