<script lang="ts">
    interface Props {
        country?: string;
        size?: number;
        addClass?: string;
        alt?: string;
    }

    let { country = 'unknown', size = 2, addClass = 'border border-secondary rounded', alt = '' }: Props = $props();
    let width = $derived(size * 10);
    let height = $derived(size * 7.5)
    let imgAlt = $derived(alt || country || 'unknown')
</script>

<img src="https://storage.googleapis.com/feed-cdn-files/flags/{(country ?? 'unknown').toLowerCase()}.svg" alt="{alt}" title="{imgAlt}" style="height: {height}px; width: {width}px;" class="{addClass} flag" {width} {height}>