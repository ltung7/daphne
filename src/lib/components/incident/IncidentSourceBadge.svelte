<script lang="ts">
	interface Props {
		source: 'webhook' | 'health_check' | 'admin_manual' | 'driver_app' | 'cron_job' | 'system';
		small?: boolean;
	}

	let { source, small = false }: Props = $props();

	function getSourceInfo(src: typeof source): { label: string; class: string } {
		switch (src) {
			case 'webhook':
				return { label: 'Webhook', class: 'bg-primary' };
			case 'health_check':
				return { label: 'Sprawdzanie zdrowia', class: 'bg-success' };
			case 'admin_manual':
				return { label: 'Ręcznie (admin)', class: 'bg-dark' };
			case 'driver_app':
				return { label: 'Aplikacja kierowcy', class: 'bg-info text-dark' };
			case 'cron_job':
				return { label: 'Zadanie cron', class: 'bg-secondary' };
			case 'system':
				return { label: 'System', class: 'bg-warning text-dark' };
			default:
				return { label: src, class: 'bg-light text-dark' };
		}
	}

	const { label, class: badgeClass } = $derived(getSourceInfo(source));
	const sizeClass = $derived(small ? 'small' : 'fs-6');
</script>

<span class="badge {badgeClass} {sizeClass}">{label}</span>