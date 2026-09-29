<script lang="ts">
	interface Props {
		status: 'info' | 'open' | 'resolved';
		small?: boolean;
	}

	let { status, small = false }: Props = $props();

	function getStatusInfo(stat: typeof status): { label: string; class: string } {
		switch (stat) {
			case 'resolved':
				return { label: 'ROZWIĄZANE', class: 'bg-success' };
			case 'open':
				return { label: 'OTWARTE', class: 'bg-danger' };
			case 'info':
				return { label: 'INFORMACJA', class: 'bg-info text-dark' };
			default:
				return { label: stat, class: 'bg-secondary' };
		}
	}

	const { label, class: badgeClass } = $derived(getStatusInfo(status));
	const sizeClass = $derived(small ? 'small' : 'fs-6');
</script>

<span class="badge {badgeClass} {sizeClass} align-self-center">{label}</span>