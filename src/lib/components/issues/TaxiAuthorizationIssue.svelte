<script lang="ts">
	import ExpirationIssue from './ExpirationIssue.svelte';

	interface Props {
		problem: HealthCheck.TaxiAuthorizationExpiringIssue;
	}
	const { problem }: Props = $props();
</script>

<ExpirationIssue {problem} title="Upoważnienie taksówkarskie">
	ważności upoważnienia taksówkarskiego kierowcy <b class="text-dark">{problem.driver}</b>
</ExpirationIssue>