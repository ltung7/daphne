<script lang="ts">
	import TooltipSquareIconButton from '$lib/misc/TooltipSquareIconButton.svelte';
	import ClosableModal from '$lib/misc/ClosableModal.svelte';
	import CustomFormTextarea from '$lib/form/CustomFormTextarea.svelte';
	import CustomFormText from '$lib/form/CustomFormText.svelte';
	import { page } from '$app/state';
	import { internal } from '$lib/nav/internal';

	interface Props {
		driverId: string;
		push?: boolean;
		sms?: boolean;
	}

	const { driverId, push = false, sms = false }: Props = $props();

	let modalOpen = $state(false);
	let contactType = $state<'push' | 'email' | 'sms'>('push');
	let subject = $state('');
	let message = $state('');
	let isSending = $state(false);

	const openModal = (type: 'push' | 'email' | 'sms') => {
		contactType = type;
		subject = '';
		message = '';
		modalOpen = true;
	};

	const sendMessage = async () => {
		isSending = true;
		try {
			const res = await internal.post(`${page.url.pathname}/contact`, {
				driverId,
				type: contactType,
				subject,
				message
			});
			if (res !== undefined) {
				modalOpen = false;
			} else {
				console.error('Failed to send message');
			}
		} catch (e) {
			console.error(e);
		} finally {
			isSending = false;
		}
	};

	let modalTitle = $derived(contactType === 'push' ? 'Wyślij powiadomienie Push' : contactType === 'email' ? 'Wyślij wiadomość e-mail' : 'Wyślij wiadomość SMS');
</script>

<div class="d-flex position-absolute bottom-0 start-0 justify-content-end w-100" style="background-color: rgba(216, 216, 216, 0.75)">
	<TooltipSquareIconButton icon="bell-notification-social-media" hoverText="Wyślij powiadomienie Push" onClick={() => openModal('push')} disabled={!push} />
	<TooltipSquareIconButton icon="message-sms" hoverText="Wyślij wiadomość SMS" onClick={() => openModal('sms')} disabled={!sms} />
	<TooltipSquareIconButton icon="envelope-dot" hoverText="Wyślij wiadomość e-mail" onClick={() => openModal('email')} />
</div>

<ClosableModal bind:isOpen={modalOpen} headerText={modalTitle} buttonCaption={isSending ? 'Wysyłanie...' : 'Wyślij'} onClick={sendMessage}>
	{#if contactType !== 'sms'}
		<CustomFormText caption="Temat" bind:value={subject} />
	{/if}
	<CustomFormTextarea caption="Wiadomość" bind:value={message} size={5} />
</ClosableModal>
