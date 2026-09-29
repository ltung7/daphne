<script lang="ts">
	interface Props {
		category: 'safety' | 'platform_account' | 'compliance' | 'driver_conduct' | 'vehicle_issue' | 'data_sync' | 'financial';
		small?: boolean;
	}

	let { category, small = false }: Props = $props();

	function getCategoryInfo(cat: typeof category): { label: string; class: string } {
		switch (cat) {
			case 'safety':
				return { label: 'Bezpieczeństwo', class: 'bg-danger' };
			case 'platform_account':
				return { label: 'Konto platformy', class: 'bg-primary' };
			case 'compliance':
				return { label: 'Zgodność', class: 'bg-info text-dark' };
			case 'driver_conduct':
				return { label: 'Postępowanie kierowcy', class: 'bg-warning text-dark' };
			case 'vehicle_issue':
				return { label: 'Problem z pojazdem', class: 'bg-secondary' };
			case 'data_sync':
				return { label: 'Synchronizacja danych', class: 'bg-success' };
			case 'financial':
				return { label: 'Finanse', class: 'bg-dark' };
			default:
				return { label: cat, class: 'bg-light text-dark' };
		}
	}

	const { label, class: badgeClass } = $derived(getCategoryInfo(category));
	const sizeClass = $derived(small ? 'small' : 'fs-6');
</script>

<span class="badge {badgeClass} {sizeClass}">{label}</span>