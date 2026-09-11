<script lang="ts">
	import ExpirationIssue from './ExpirationIssue.svelte';

	interface Props {
		problem: HealthCheck.InsuranceExpiringIssue;
	}

	const { problem }: Props = $props();
</script>

<ExpirationIssue {problem} title="Ubezpieczenie">
	ubezpieczenia pojazdu <b class="text-dark">{problem.entityId}</b>
</ExpirationIssue>