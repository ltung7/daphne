<script lang="ts">
	import { Badge } from '@sveltestrap/sveltestrap';

	let { status }: { status: false | number } = $props();

	let color = $derived(status === false ? 'danger' : 'success');
	let label = $derived(status === false ? 'Nieprzeczytana' : 'Przeczytana');
</script>

<Badge {color}>{label}</Badge>
