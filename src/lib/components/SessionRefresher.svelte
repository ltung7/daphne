<script lang="ts">
	import { onDestroy } from 'svelte';
	import { browser } from '$app/environment';

	let { exp = 0 }: { exp: number | undefined } = $props();
	let refreshTimer: ReturnType<typeof setTimeout> | null = null;
	let currentExp = $state(0);

	$effect(() => {
		if (exp && exp !== currentExp) {
			currentExp = exp;
			if (browser) scheduleRefresh();
		}
	});

	async function getAuthUser(auth: any): Promise<any> {
		if (auth.currentUser) return auth.currentUser;
		const { onAuthStateChanged } = await import('firebase/auth');
		return new Promise((resolve) => {
			const unsubscribe = onAuthStateChanged(auth, (u: any) => {
				unsubscribe();
				resolve(u);
			});
			setTimeout(() => resolve(null), 3000);
		});
	}

	async function refreshSession() {
		try {
			const { getAuth } = await import('firebase/auth');
			const { app } = await import('$lib/firebase/client');
			if (!app) return;

			const auth = getAuth(app);
			const user = await getAuthUser(auth);
			if (!user) {
				// Don't kick the user out - the server cookie may still be valid
				// Retry checking after 5 minutes
				if (refreshTimer) clearTimeout(refreshTimer);
				refreshTimer = setTimeout(scheduleRefresh, 5 * 60 * 1000);
				return;
			}

			const idToken = await user.getIdToken();
			const response = await fetch('/api/auth/refresh', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ idToken, rememberMe: true })
			});

			if (response.ok) {
				const result = await response.json();
				if (result.exp) {
					currentExp = result.exp;
					scheduleRefresh();
				}
			} else {
				// Network error or temporary server issue - retry in 5 minutes without kicking user out
				if (refreshTimer) clearTimeout(refreshTimer);
				refreshTimer = setTimeout(scheduleRefresh, 5 * 60 * 1000);
			}
		} catch (err) {
			console.warn('Background session refresh failed:', err);
			if (refreshTimer) clearTimeout(refreshTimer);
			refreshTimer = setTimeout(scheduleRefresh, 5 * 60 * 1000);
		}
	}

	function scheduleRefresh() {
		if (refreshTimer) clearTimeout(refreshTimer);
		if (!currentExp) return;

		const timeUntilExpiry = (currentExp * 1000) - Date.now();
		
		// For long sessions (>24h), refresh when less than 24 hours remain.
		// For shorter sessions (<=24h), refresh when less than 2 hours remain.
		const threshold = timeUntilExpiry > 24 * 60 * 60 * 1000
			? 24 * 60 * 60 * 1000
			: 2 * 60 * 60 * 1000;

		if (timeUntilExpiry <= threshold) {
			refreshSession();
		} else {
			// Schedule refresh before expiration, capped at 6 hours to prevent long setTimeout issues
			const targetDelay = timeUntilExpiry - threshold;
			const delay = Math.min(targetDelay, 6 * 60 * 60 * 1000);
			refreshTimer = setTimeout(scheduleRefresh, delay);
		}
	}

	onDestroy(() => {
		if (refreshTimer) clearTimeout(refreshTimer);
	});
</script>