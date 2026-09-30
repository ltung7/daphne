<script lang="ts">
	import { onMount } from "svelte";
	import { FirebaseApp } from "sveltefire";
	import Spinner from "./Spinner.svelte";
	import { app, auth } from "$lib/firebase/client";
	import { getFirestore, type Firestore } from "firebase/firestore";

	interface Props {
		spinnerSize?: false | string;
		children?: import('svelte').Snippet;
		onFirestore?: (firestore: Firestore) => void;
	}

	let { spinnerSize = false, children, onFirestore }: Props = $props();

	let localFirestore: Firestore | undefined = $state();

	onMount(() => {
		if (app) {
			localFirestore = getFirestore(app);
			if (localFirestore) onFirestore?.(localFirestore);
		}
	});
</script>

{#if auth}
	<FirebaseApp {auth} firestore={localFirestore}>
		{@render children?.()}
	</FirebaseApp>
{:else if spinnerSize}
	<Spinner size={spinnerSize} />
{/if}

