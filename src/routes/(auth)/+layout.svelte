<script lang="ts">
	import LanguageSelector from '$lib/misc/LanguageSelector.svelte';
	import { layoutState } from '$lib/nav/stores.svelte';
	let { children } = $props();
</script>

<svelte:head>
	<title>EISG Taxi</title>
</svelte:head>

<div class="container">
	<div class="row justify-content-center">
		<div class="col-md-6 col-lg-5">
			<div class="card mt-5">
				<div class="card-body p-4">
					<div class="d-flex justify-content-end">
						<LanguageSelector />
					</div>
					{#key layoutState.currentLocale}
						{@render children()}
					{/key}
				</div>
			</div>
		</div>
	</div>
</div>
