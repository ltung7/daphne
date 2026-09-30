<script lang="ts">
	import '$lib/assets/argon.css';
	import '$lib/assets/custom.css';
	import Sidebar from '$lib/components/Sidebar.svelte';
	import Splash from '$lib/misc/Splash.svelte';
	import Toasts from '$lib/toast/Toasts.svelte';
	import SessionRefresher from '$lib/components/SessionRefresher.svelte';
	import { fly } from 'svelte/transition';
	import { page } from '$app/state';
	
	let { data, children } = $props();
</script>

<Splash />
<Toasts />
<SessionRefresher exp={data.exp} />

<div class="d-flex min-vh-100 bg-light">
	<Sidebar />

	<main class="flex-grow-1 d-flex flex-column overflow-hidden">
		<div class="p-3 px-md-4 overflow-y-auto flex-grow-1 page-content">
			{#key page.url.pathname}
				<div in:fly={{ x: 50, duration: 200 }}>
					{@render children()}
				</div>
			{/key}
		</div>
	</main>
</div>