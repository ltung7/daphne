<script lang="ts">
	import { untrack } from "svelte";
    import * as m from '$lib/paraglide/messages.js';

    interface Props { 
        page: Streamer.StreamingPage;
        sizePx?: number;
    }

    const { page, sizePx = 50 }: Props = $props();
    let src = $state(untrack(() => page.picture));

    function handleError() {
        if (src !== '/img/icons/facebook.svg') src = '/img/icons/facebook.svg';
    }
</script>

<a href="https://www.facebook.com/{page.pageId}" target="_blank" title="{ m.facebookOpen({ page: page.name })}">
    <img src={src} class="fb-profile-img" width="{sizePx}" height="{sizePx}" alt={page.name} onerror={handleError} />
</a>