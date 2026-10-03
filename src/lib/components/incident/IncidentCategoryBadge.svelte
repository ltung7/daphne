<script lang="ts">
	interface Props {
		category: App.Incident.Category;
		small?: boolean;
	}

	let { category, small = false }: Props = $props();

	function getCategoryInfo(cat: typeof category): { label: string; bg: string; text: string } {
		switch (cat) {
			case 'safety':
				return { label: 'Bezpieczeństwo', bg: '#dc3545', text: '#ffffff' };
			case 'platform_account':
				return { label: 'Redesharing', bg: '#0d6efd', text: '#ffffff' };
			case 'compliance':
				return { label: 'Zgodność', bg: '#fd7e14', text: '#ffffff' };
			case 'driver_conduct':
				return { label: 'Kierowca', bg: '#ffc107', text: '#212529' };
			case 'vehicle_issue':
				return { label: 'Pojazd', bg: '#0dcaf0', text: '#212529' };
			case 'data_sync':
				return { label: 'Synchronizacja', bg: '#198754', text: '#ffffff' };
			case 'financial':
				return { label: 'Finanse', bg: '#6f42c1', text: '#ffffff' };
			default:
				return { label: cat, bg: '#d63384', text: '#ffffff' };
		}
	}

	const { label, bg, text } = $derived(getCategoryInfo(category));
	const sizeClass = $derived(small ? 'small' : 'fs-6');
</script>

<span class="badge {sizeClass}" style="background-color: {bg}; color: {text};">{label}</span>