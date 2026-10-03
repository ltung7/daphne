<script lang="ts">
	interface Props {
		source: App.Incident.Source;
		small?: boolean;
	}

	let { source, small = false }: Props = $props();

	function getSourceInfo(src: typeof source): { label: string; bg: string; text: string } {
		switch (src) {
			case 'webhook':
				return { label: 'Webhook', bg: '#0d6efd', text: '#ffffff' };
			case 'health_check':
				return { label: 'Sprawdzanie zdrowia', bg: '#198754', text: '#ffffff' };
			case 'admin_manual':
				return { label: 'Ręcznie (admin)', bg: '#212529', text: '#ffffff' };
			case 'driver_app':
				return { label: 'Aplikacja kierowcy', bg: '#0dcaf0', text: '#212529' };
			case 'cron_job':
				return { label: 'Zadanie cron', bg: '#6c757d', text: '#ffffff' };
			case 'system':
				return { label: 'System', bg: '#ffc107', text: '#212529' };
			case 'test':
				return { label: 'Test', bg: '#800080', text: '#ffffff' };
			default:
				return { label: src, bg: '#f8f9fa', text: '#212529' };
		}
	}

	const { label, bg, text } = $derived(getSourceInfo(source));
	const sizeClass = $derived(small ? 'small' : 'fs-6');
</script>

<span class="badge {sizeClass}" style="background-color: {bg}; color: {text};">{label}</span>