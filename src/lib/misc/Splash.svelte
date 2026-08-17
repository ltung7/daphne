<script>
	import { fade } from 'svelte/transition';
	import { loading, startLoad, endLoad } from '$lib/nav/loader';
	import { browser } from '$app/environment';
    export let header = 'Ładuję dane', message = 'Proszę czekać';

    if (browser) {
        window.startLoad = startLoad;
        window.endLoad = endLoad;
    };
</script>

{#if $loading}
    <div class="position-fixed top-0 start-0 w-100 h-100 splash-back load-content flex-center" style="z-index: 10061;" transition:fade={{ duration:100 }}>
        <div class="d-flex flex-column text-center text-dark splash-content" style="z-index: 10062">
            <h1>{header}</h1>
            <div style="height: 130px;"></div>
            <h4>{message}</h4>
        </div>
    </div>
{/if}