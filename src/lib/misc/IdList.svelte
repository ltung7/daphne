<script lang="ts">
	import UIcon from "$lib/misc/UIcon.svelte";
	import { flip } from "svelte/animate";
	import { fly } from "svelte/transition";
    let { list, clicked = console.debug } = $props();
</script>

<div class="flex-center flex-wrap">
    {#each list as id (id)}
        <button class="btn btn-outline-primary btn-sm flex-center m-1 px-2 py-1" onclick={() => clicked(id)} in:fly={{ y: -25 }} out:fly={{ x: 25 }} animate:flip>
            {id}
            <UIcon name="cross-small" color="secondary" class="ms-2" />
        </button>
    {/each}
</div>