<script lang="ts">
    import LocalizedMailWrapper from '../localized/LocalizedMailWrapper.svelte';
    import type { LocalizedEmailProps } from '../localized/localizedMailer';

    interface Props extends LocalizedEmailProps {
        subject: string;
        htmlBody: string;
    }
    let { locale, _messages, subject, htmlBody }: Props = $props();
</script>

<LocalizedMailWrapper {locale} {_messages} title={subject} footer>
    <h2 style="margin: 0 0 16px 0; color: #12399C;">{subject}</h2>
    <div style="font-size: 15px; color: #333; line-height: 1.6;">
        {@html htmlBody}
    </div>
</LocalizedMailWrapper>