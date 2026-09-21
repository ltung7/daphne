<script lang="ts">
	import { untrack } from "svelte";
    import LocalizedMailWrapper from '$lib/server/notifications/localized/LocalizedMailWrapper.svelte';
    import type { LocalizedEmailProps } from '$lib/server/notifications/localized/localizedMailer';

    interface Props extends LocalizedEmailProps {
        logo?: string;
        link: string;
    }
    let { logo, link, locale, _messages }: Props = $props();
    
    const t = untrack(() => _messages).reset_password;
</script>

<LocalizedMailWrapper {logo} title={t.title} footer {locale} {_messages}>
    <h2>{t.title}</h2>
    <hr>
    <div style="font-size: 14px; color: dimgray; text-align: center;">
        {@html t.contents}
    </div>
    <div style="font-size: 16px; padding-top: 12px; padding-bottom: 12px; text-align: center;">
        <a href="{link}">[{t.button_text}]</a>
    </div>
    <footer style="font-size: 12px; color: dimgray; text-align: center;">
        {t.footer}
    </footer>
</LocalizedMailWrapper>