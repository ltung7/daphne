<script lang="ts">
    /* eslint svelte/no-at-html-tags: "off" */
	import MailWrapper from "./MailWrapper.svelte";

    let { logo, contents } = $props();
    const title = '__name__'
</script>

<MailWrapper {logo} {title} footer>
    <h3>__name__</h3>
    <hr>
    {@html contents}
</MailWrapper>