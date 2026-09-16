<script lang="ts">
	import { onDestroy } from 'svelte';
	import { browser } from '$app/environment';

	let { exp = 0 }: { exp: number | undefined } = $props();

	let refreshTimer: ReturnType<typeof setTimeout> | null = null;
	let currentExp = $state(0);

	$effect(() => {
		if (exp && !currentExp) {
			currentExp = exp;
			if (browser) scheduleRefresh();
		}
	});

	async function refreshSession() {
		try {
			const { getAuth } = await import('firebase/auth');
			const { app } = await import('$lib/firebase/client');
			if (!app) return;

			const auth = getAuth(app);
			const user = auth.currentUser;
			if (!user) {
				window.location.href = '/login?expired=true';
				return;
			}

			const idToken = await user.getIdToken(true);
			const response = await fetch('/api/auth/refresh', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ idToken })
			});

			if (response.ok) {
				const result = await response.json();
				if (result.exp) {
					currentExp = result.exp;
					scheduleRefresh();
				}
			} else {
				window.location.href = '/login?expired=true';
			}
		} catch (err) {
			console.warn('Background session refresh failed:', err);
		}
	}

	function scheduleRefresh() {
		if (refreshTimer) clearTimeout(refreshTimer);
		if (!currentExp) return;

		const timeUntilExpiry = (currentExp * 1000) - Date.now();
		
		// If expired or expiring in less than 5 minutes, refresh immediately
		if (timeUntilExpiry <= 5 * 60 * 1000) {
			refreshSession();
		} else {
			// Schedule refresh for 5 minutes before expiration
			const delay = timeUntilExpiry - (5 * 60 * 1000);
			refreshTimer = setTimeout(refreshSession, delay);
		}
	}

	onDestroy(() => {
		if (refreshTimer) clearTimeout(refreshTimer);
	});
</script>