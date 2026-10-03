<script lang="ts">
	interface Props {
		severity: App.Incident.Severity;
		small?: boolean;
	}

	let { severity, small = false }: Props = $props();

	function getSeverityInfo(sev: typeof severity): { label: string; class: string } {
		switch (sev) {
			case 'critical':
				return { label: 'KRYTYCZNE', class: 'bg-danger' };
			case 'high':
				return { label: 'WYSOKIE', class: 'bg-warning text-dark' };
			case 'medium':
				return { label: 'ŚREDNIE', class: 'bg-dark' };
			case 'low':
				return { label: 'NISKIE', class: 'bg-secondary' };
			default:
				return { label: sev, class: 'bg-light text-dark' };
		}
	}

	const { label, class: badgeClass } = $derived(getSeverityInfo(severity));
	const sizeClass = $derived(small ? 'small' : 'fs-6');
</script>

<span class="badge {badgeClass} {sizeClass} align-self-center">{label}</span>