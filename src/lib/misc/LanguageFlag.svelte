<script lang="ts">
	interface Props {
		language?: string;
		size?: number;
		addClass?: string;
		alt?: string;
	}

	/**
	 * [0] ISO language code
	 * [1] ISO country code (primary)
	 */
	const KNOWN_EXCEPTIONS: Record<string, string> = {
		hi: 'in',
		cs: 'cz',
		uk: 'ua',
		be: 'by',
		tl: 'ph',
		bn: 'bd',
		ka: 'ge',
		ro: 'md',
		sr: 'rs'
	};

	let { language = 'unknown', size = 2, addClass = 'border border-secondary rounded', alt = '' }: Props = $props();
	let width = $derived(size * 10);
	let height = $derived(size * 7.5);
	let imgAlt = $derived(alt || language || 'unknown');
	let country = $derived(KNOWN_EXCEPTIONS[language] ?? language);
</script>

<img src="https://storage.googleapis.com/feed-cdn-files/flags/{(country ?? 'unknown').toLowerCase()}.svg" {alt} title={imgAlt} style="height: {height}px; width: {width}px;" class="{addClass} flag" {width} {height} />
