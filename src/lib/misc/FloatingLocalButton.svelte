<script lang="ts">
	import UIcon from '$lib/misc/UIcon.svelte';
	import { Tooltip } from '@sveltestrap/sveltestrap';
	import { onMount } from 'svelte';
    interface Props {
        user: string|undefined;
    }

    let { user }: Props = $props();
    let local: boolean = $state(false);
    let element: HTMLElement | undefined = $state();
    let pathname: string = $state('')
    
    onMount(() => {
        pathname = window.location.pathname;
        local = window.location.origin.includes('localhost')
    })
</script>

{#if user === 'tomasz'}
    <a
        bind:this={element}
        href={local ? 
            `https://app.liveportal.pl${pathname}` :
            `http://localhost:4600${pathname}`
        }
        class="position-fixed transition bg-white border-2 shadow-primary bottom-0 start-0 mb-3 z-index-5 btn btn-outline-primary d-print-none wh-5 radius-45"
        style="z-index: 5; margin-left: 1rem">
        <UIcon name={local ? 'site' : 'bug'} size={1} />
    </a>

    <Tooltip target={element}>
        {local ? 'Przejdź na sewer' : 'Przejdź do wersji lokalnej'}
    </Tooltip>
{/if}