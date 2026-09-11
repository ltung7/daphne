<script lang="ts">
    import type { Component } from 'svelte';
    import InsuranceExpiringIssue from './InsuranceExpiringIssue.svelte';
    import TechnicalExpiringIssue from './TechnicalExpiringIssue.svelte';
    import LicenseExpiringIssue from './LicenseExpiringIssue.svelte';
    import TaxiAuthorizationIssue from './TaxiAuthorizationIssue.svelte';

    interface Props {
        problem: HealthCheck.HealthIssue;
    }

    let { problem }: Props = $props();

    // Use `any` for the prop constraint in the dictionary so specific issue types are accepted
    const issueComponents: Record<string, Component<{ problem: any }>> = {
        insurance_expiring: InsuranceExpiringIssue,
        technical_expiring: TechnicalExpiringIssue,
        license_expiring: LicenseExpiringIssue,
        taxi_authorization_expiring: TaxiAuthorizationIssue
    };

    const IssueComponent = $derived(issueComponents[problem.type]);
</script>

{#if IssueComponent}
    <IssueComponent {problem} />
{/if}