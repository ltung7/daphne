import { getVehicle, updateVehicle } from '$lib/server/db/firebase/vehicles.fdb';
import { addVehicleStatusChange } from '$lib/server/db/firebase/vehicleStatusChange.fdb';
import { logger } from '$lib/utils/logger';

/**
 * Resolves vehicle expiration health issues.
 * - warning severity (expiring soon): notify only, no status change
 * - critical severity (expired): auto-transition vehicle to 'unmovable' + notify
 */
export async function resolveVehicleExpirationIssues(
	issues: HealthCheck.HealthIssue[],
	params: HealthCheck.HealthCheckParams
): Promise<void> {
	const vehicleIssues = issues.filter(i => i.entityType === 'vehicle');
	
	// Group by vehicle
	const byVehicle = new Map<string, HealthCheck.HealthIssue[]>();
	for (const issue of vehicleIssues) {
		const existing = byVehicle.get(issue.entityId) || [];
		existing.push(issue);
		byVehicle.set(issue.entityId, existing);
	}

	// Build vehicle lookup from params first (avoids extra DB queries)
	const vehiclesFromParams = new Map<string, Vehicle.Vehicle>();
	if (params.vehicles?.length) {
		for (const v of params.vehicles) {
			vehiclesFromParams.set(v.id, v);
		}
	}

	for (const [ vehicleId, vehicleIssues ] of byVehicle) {
		const hasCritical = vehicleIssues.some(i => i.severity === 'critical');
		const hasWarning = vehicleIssues.some(i => i.severity === 'warning');

		if (hasCritical) {
			// Try to get vehicle from params first, fallback to query
			let vehicle = vehiclesFromParams.get(vehicleId) ?? null;
			if (!vehicle) {
				vehicle = await getVehicle(vehicleId);
			}
			if (!vehicle) {
				logger.log(`[RESOLVER] Vehicle ${vehicleId} not found, skipping`);
				continue;
			}

			// Only transition if not already unmovable
			if (vehicle.status !== 'unmovable') {
				// Auto-transition to 'unmovable'
				await updateVehicle(vehicleId, { status: 'unmovable' });
				
				// Log status change
				await addVehicleStatusChange({
					vehicleId,
					status: 'unmovable',
					timestamp: Date.now(),
					userId: 'system',
					userName: 'Auto Health Check',
					extraData: {
						source: 'auto_health_check',
						reason: 'Auto-transition: expired insurance/technical',
						issues: vehicleIssues.map(i => ({ type: i.type, expirationDate: i.expirationDate }))
					}
				});
				
				logger.log(`[RESOLVER] Vehicle ${vehicleId}: transitioned to 'unmovable'`);
			}

			// TODO: Send notification (Managers + assigned driver)
			// NOTE: Notification system for vehicle status changes not yet fully implemented
			// - Create vehicle-specific notification templates (email/push/in-app)
			// - Notify managers/admins via email/push
			// - Notify assigned driver via email/push/in-app
			logger.log(`[RESOLVER] Vehicle ${vehicleId}: NOTIFICATION TODO - notify managers and assigned driver`);
		} else if (hasWarning) {
			// TODO: Send "expiring soon" notification only
			// NOTE: Notification system for vehicle status changes not yet fully implemented
			// - Create vehicle-specific "expiring soon" notification templates
			logger.log(`[RESOLVER] Vehicle ${vehicleId}: WARNING - notify expiring soon (not implemented)`);
		}
	}
}