<script lang="ts">
	import "$lib/assets/argon.css"
	import "$lib/assets/custom.css"
	import Splash from "$lib/misc/Splash.svelte";
	import Toasts from "$lib/toast/Toasts.svelte";
	let { children } = $props();
</script>

<Splash />
<Toasts />

<div class="container mt-3 md-md-4">
	{@render children()}
</div>
