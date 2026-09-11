<script lang="ts">
    import ExpirationIssue from './ExpirationIssue.svelte';

    interface Props {
        problem: HealthCheck.LicenseExpiringIssue;
    }

    let { problem }: Props = $props();
</script>

<ExpirationIssue {problem} title="Prawo jazdy">
    ważności prawa jazdy kierowcy <b class="text-dark">{problem.driver}</b>
</ExpirationIssue>