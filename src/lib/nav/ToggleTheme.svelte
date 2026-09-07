<script lang="ts">
	import TooltipText from '$lib/misc/TooltipText.svelte';
	import UIcon from '$lib/misc/UIcon.svelte';
	import { layoutState } from './stores.svelte';

	type Theme = 'light' | 'dark' | 'auto';

	let preference = $state<Theme>(typeof window !== 'undefined' ? (localStorage.getItem('theme') as Theme) || 'auto' : 'auto');

	let systemIsDark = $state(typeof window !== 'undefined' ? window.matchMedia('(prefers-color-scheme: dark)').matches : false);

	// Sync with system preference updates
	$effect(() => {
		const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
		const handleSystemChange = (e: MediaQueryListEvent) => (systemIsDark = e.matches);

		mediaQuery.addEventListener('change', handleSystemChange);
		return () => mediaQuery.removeEventListener('change', handleSystemChange);
	});

	// Apply Bootstrap 5 attribute & save preference
	$effect(() => {
		const activeTheme = preference === 'auto' ? (systemIsDark ? 'dark' : 'light') : preference;

		document.documentElement.setAttribute('data-bs-theme', activeTheme);
		localStorage.setItem('theme', preference);
	});

	const toggle = () => {
		if (preference === 'light') preference = 'dark';
		else preference = 'light';
	}
</script>

<TooltipText hide={layoutState.isSidebarExpanded} hoverText="Zmień motyw" placement="right">
	<button class="btn w-100 text-start d-flex align-items-center nav-btn py-2" onclick={toggle}>
		<span class="nav-icon-wrapper"><UIcon name='eclipse-alt' size={4} /></span>
		{#if layoutState.isSidebarExpanded}
			<span class="ms-3 text-truncate">Zmień motyw</span>
		{/if}
	</button>
</TooltipText>
