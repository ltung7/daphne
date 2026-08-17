<script lang="ts">
	import { onMount, onDestroy, untrack } from 'svelte';
	import { pushState } from '$app/navigation';
	import { browser } from '$app/environment';

	// Svelte 5 - Props
	let { level = 0, onIntercept }: { 
		level: number, 
		onIntercept: (targetLevel: number) => void 
	} = $props();

	// Liczba aktualnie wypchniętych wpisów do historii
	let pushedCount = $state(0);
	let isProcessingPopState = false;

	/**
	 * Synchronizacja historii z poziomem (level)
	 */
	$effect(() => {
		// Obserwujemy zmianę level
		const target = level;

		untrack(() => {
			if (!browser) return;

			if (target > pushedCount) {
				// Aplikacja weszła głębiej -> dodajemy wpisy
				const diff = target - pushedCount;
				for (let i = 0; i < diff; i++) {
					pushState('', {});
					pushedCount++;
				}
			} else if (target < pushedCount && !isProcessingPopState) {
				// UI cofnęło się ręcznie (np. przycisk "X" lub "Anuluj")
				// Musimy zdjąć wpisy z historii przeglądarki
				const diff = pushedCount - target;
				pushedCount = target;
				window.history.go(-diff);
			}
			
			// Resetujemy flagę po przetworzeniu popstate
			isProcessingPopState = false;
		});
	});

	function handlePopState(event: PopStateEvent) {
		if (pushedCount > 0) {
			// Blokujemy domyślną nawigację SvelteKit
			event.stopImmediatePropagation();
			event.preventDefault();

			isProcessingPopState = true;
			pushedCount--; 
			
			// Informujemy rodzica, że poziom spadł o 1
			onIntercept(pushedCount);
		}
	}

	onMount(() => {
		if (!browser) return;
		window.addEventListener('popstate', handlePopState, true);
		return () => window.removeEventListener('popstate', handlePopState, true);
	});

	// Zapewnienie, że przy zniszczeniu komponentu historia wraca do normy
	onDestroy(() => {
		if (browser && pushedCount > 0) {
			isProcessingPopState = true;
			window.history.go(-pushedCount);
		}
	});
</script>