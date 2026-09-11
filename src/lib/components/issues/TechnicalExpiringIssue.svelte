<script lang="ts">
	import ExpirationIssue from './ExpirationIssue.svelte';

	interface Props {
		problem: HealthCheck.TechnicalExpiringIssue;
	}

	const { problem }: Props = $props();
</script>

<ExpirationIssue {problem} title="Badanie techniczne">
	badania technicznego pojazdu <b class="text-dark">{problem.entityId}</b>
</ExpirationIssue>