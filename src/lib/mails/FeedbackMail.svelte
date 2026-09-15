<script lang="ts">
	import dayjs from 'dayjs';
	import MailWrapper from './MailWrapper.svelte';
	import { env } from '$env/dynamic/public';
	import { untrack } from 'svelte';

	interface Contents {
		user: string;
		timestamp: string | number;
		url: string;
		status: number;
		message: string;
		role: string;
		request: {
			method?: string;
			url?: string;
			status?: number;
			length?: number;
		};
		lastMessage?: string;
		browser: string;
		version: string;
	}

	interface Props {
		logo?: string;
		contents: Contents;
	}

	let { logo, contents }: Props = $props();

	const title = untrack(() => `Sybil feedback od użytkownika ${contents.user} (${contents.timestamp})`);
</script>

<MailWrapper {logo} {title} footer>
	<p>
		URL: {contents.url}
		{#if contents.status !== 200}
			({contents.status})
		{/if}
	</p>
	<hr />
	<p style="font-weight: 800">Treść</p>
	<p style="font-size: 14px;">{contents.message}</p>
	<p style="text-align: right"><b>{contents.user}</b> ({contents.role})</p>
	<p style="text-align: right">{dayjs(contents.timestamp).format('DD/MM/YYYY HH:mm:ss')}</p>
	<hr />
	{#if contents.request.method}
		<p style="font-weight: 800">Ostatni request API</p>
		<p>{contents.request.method} {contents.request.url}</p>
		<p>Status: {contents.request.status} / {contents.request.length}</p>
	{/if}
	<p>Komunikat: {contents.lastMessage ?? '-'}</p>
	<p>Przeglądarka: {contents.browser}</p>
	<p>
		Wersja: {contents.version}
		{#if env.PUBLIC_APP_VER !== contents.version}(Najnowsza: <strong>{env.PUBLIC_APP_VER}</strong>){/if}
	</p>
</MailWrapper>
