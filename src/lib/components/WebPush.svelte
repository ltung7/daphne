<script lang="ts">
	import * as firebase from '$lib/firebase';
	const messaging = firebase.messaging;
	const getToken = firebase.getToken;
	const onMessage = firebase.onMessage;
	import { onMount } from 'svelte';
	import IconButton from '$lib/misc/IconButton.svelte';
	import { m } from '$lib/paraglide/messages.js';
	import { PUBLIC_VAPID_KEY } from '$env/static/public';
	import { addToast } from '$lib/toast/index.js';
	import { dev } from '$app/environment';

	interface Props {
		fcmToken?: string;
		onToken?: (token: string) => void;
		onRevoke?: () => void;
	}

	let { fcmToken, onToken, onRevoke }: Props = $props();

	async function requestNotificationPermission() {
		if (!('Notification' in window)) {
			addToast(m.webpush_unsupported_browser(), 'warning');
			return;
		}

		const permission = await Notification.requestPermission();
		if (permission === 'granted') {
			try {
				// Register the service worker manually to ensure correct scope
				// SvelteKit serves it as an ES module in dev mode and a classic script in production
				const registration = await navigator.serviceWorker.register('/service-worker.js', {
					type: dev ? 'module' : 'classic'
				});

				// Get FCM Token
				const currentToken = await getToken(messaging as any, {
					vapidKey: PUBLIC_VAPID_KEY,
					serviceWorkerRegistration: registration
				});

				if (currentToken) {
					console.log('FCM Token:', currentToken);
					if (onToken) onToken(currentToken);
					fcmToken = currentToken;
				} else {
					console.warn(m.webpush_no_token());
				}
			} catch (err) {
				console.error(m.webpush_error_retrieving(), err);
			}
		}
	}

	function revokeNotificationPermission() {
		if (onRevoke) onRevoke();
		fcmToken = '';
	}

	onMount(() => {
		// Listen for messages while the application is in the foreground
		if (messaging) {
			const unsubscribe = onMessage(messaging as any, (payload: any) => {
				console.log('Foreground message received:', payload);
				if (payload.notification) {
					addToast(payload.notification.body, 'primary', payload.notification.title);
				}
			});

			return () => unsubscribe();
		}
	});
</script>

{#if fcmToken && fcmToken !== ''}
	<IconButton 
		onclick={revokeNotificationPermission}
		caption={m.webpush_revoke_notifications()}
		icon="bell-slash"
		color="danger"
	/>
{:else}
	<IconButton 
		onclick={requestNotificationPermission}
		caption={m.webpush_enable_notifications()}
		icon="bell"
		color="primary"
	/>
{/if}
