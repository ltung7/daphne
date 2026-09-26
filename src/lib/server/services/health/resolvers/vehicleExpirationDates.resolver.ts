/**
 * Resolves vehicle expiration health issues.
 * - warning severity (expiring soon): notify only, no status change
 * - critical severity (expired): auto-transition vehicle to 'unmovable' + notify
 */
export async function resolveVehicleExpirationIssues(
	issues: HealthCheck.HealthIssue[],
	_params: HealthCheck.HealthCheckParams
): Promise<void> {
	const vehicleIssues = issues.filter(i => i.entityType === 'vehicle');
	
	// Group by vehicle
	const byVehicle = new Map<string, HealthCheck.HealthIssue[]>();
	for (const issue of vehicleIssues) {
		const existing = byVehicle.get(issue.entityId) || [];
		existing.push(issue);
		byVehicle.set(issue.entityId, existing);
	}

	for (const [ vehicleId, vehicleIssues ] of byVehicle) {
		const hasCritical = vehicleIssues.some(i => i.severity === 'critical');
		const hasWarning = vehicleIssues.some(i => i.severity === 'warning');

		if (hasCritical) {
			// TODO: Auto-transition to 'unmovable' via changeVehicleStatus()
			// TODO: Send notification (Managers + assigned driver)
			console.log(`[RESOLVER] Vehicle ${vehicleId}: CRITICAL - transition to unmovable`);
		} else if (hasWarning) {
			// TODO: Send "expiring soon" notification only
			console.log(`[RESOLVER] Vehicle ${vehicleId}: WARNING - notify expiring soon`);
		}
	}
}