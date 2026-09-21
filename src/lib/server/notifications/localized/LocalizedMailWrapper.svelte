<script lang="ts">
	import { PUBLIC_URL } from '$env/static/public';
	import type { EmailMessages } from './localizedMailer';

	interface Props {
		footer?: boolean;
		logo?: string;
		title: string;
		locale: App.Locale;
		_messages: EmailMessages;
		children: import('svelte').Snippet;
	}

	let { footer = false, logo = 'cid:logo@eisg.pl', title, locale, _messages, children }: Props = $props();
</script>

<svelte:head>
	<title>{title}</title>
</svelte:head>

<!DOCTYPE html>
<html lang={locale}>
	<head></head>
	<body style="margin:0;padding:20px;background:#f5f5f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
		<table style="text-align: center; max-width: 500px; width: 100%; min-width: 220px; margin-left: auto; margin-right: auto; margin-bottom: 30px;border:1px solid #e0e0e0;border-radius: 8px; margin-top: 1rem; background: #fff;" id="main">
			<tbody>
				<tr>
					<td style="text-align:center; padding: 20px;border-bottom:1px solid #e0e0e0;">
						<img src={logo} alt={_messages.common.app_name} style="max-height: 50px; width: auto;" width="763" height="121" title={_messages.common.app_name} />
					</td>
				</tr>
				<tr>
					<td style="padding: 30px;">
						<div style="text-align: center; font-size: 1rem; line-height: 1.6; color: #333;">
							{@render children()}
						</div>
					</td>
				</tr>
			</tbody>
		</table>
		{#if footer}
			<table style="text-align: center; max-width: 500px; width: 100%; min-width: 220px; margin-left: auto; margin-right: auto;border-top:2px solid #12399C; background: #fff; border-radius: 0 0 8px 8px;">
				<tbody>
					<tr>
						<td style="padding: 20px;">
							<footer style="color: #888; font-size: 0.8rem; line-height: 1.5;">
								<p style="margin: 0 0 10px 0;">{_messages.common.footer_app_link} <a href={PUBLIC_URL} style="color:#12399C;">{_messages.common.app_name}</a>.</p>
								<p style="margin: 0; font-size: 0.7rem;">{_messages.common.footer_confidential}</p>
								<!-- <p style="margin: 15px 0 0 0; font-size: 0.75rem;">
									{_messages.common.unsubscribe} <a href="#" style="color:#12399C;">{_messages.common.unsubscribe_link}</a>
								</p> -->
							</footer>
						</td>
					</tr>
				</tbody>
			</table>
		{/if}
	</body>
</html>
