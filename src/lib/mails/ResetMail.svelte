<script lang="ts">
    import MailWrapper from "./MailWrapper.svelte";
    interface Props { logo?: string, caption?: string, link: string }
    let { logo, caption, link }: Props = $props();
    const title = 'Reset your password'
    const footer = 'The link expires after 1 hour. If you did not request a password reset, no further action is required. You can safely ignore this email and your password will remain unchanged.'
    const contents = 'Click the button below to create a new password for your account:'
</script>

<MailWrapper {logo} {title} footer>
    <h2>{title}</h2>
    <hr>
    <div style="font-size: 14px; color: dimgray;">
        {@html contents}
    </div>
    <div style="font-size: 16px; padding-top: 12px; padding-bottom: 12px;">
        <a href="{link}">[{caption || title}]</a>
    </div>
    <footer style="font-size: 12px; color: dimgray;">
        {footer}
    </footer>
</MailWrapper>