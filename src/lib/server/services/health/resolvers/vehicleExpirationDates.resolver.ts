import { getVehicle, updateVehicle } from '$lib/server/db/firebase/vehicles.fdb';
import { getDriver } from '$lib/server/db/firebase/drivers.fdb';
import { addVehicleStatusChange } from '$lib/server/db/firebase/vehicleStatusChange.fdb';
import { sendVehicleDocumentExpiredNotification, sendVehicleDocumentExpiringNotification, type VehicleDocumentType } from '$lib/server/notifications/vehicle/vehicleDocumentNotifications';
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
		// Try to get vehicle from params first, fallback to query
		let vehicle = vehiclesFromParams.get(vehicleId) ?? null;
		if (!vehicle) {
			vehicle = await getVehicle(vehicleId);
		}
		if (!vehicle) {
			logger.log(`[RESOLVER] Vehicle ${vehicleId} not found, skipping`);
			continue;
		}

		// Fetch assigned driver contact info if assigned
		let driverContact: App.BaseContact | null = null;
		if (vehicle.assignedDriverId) {
			const driver = await getDriver(vehicle.assignedDriverId);
			if (driver) {
				driverContact = {
					id: driver.id,
					email: driver.email,
					name: driver.name,
					preferredLanguage: driver.preferredLanguage,
					phone: driver.phone,
					fcmToken: driver.fcmToken
				};
			}
		}

		const criticalIssues = vehicleIssues.filter(i => i.severity === 'critical');
		const warningIssues = vehicleIssues.filter(i => i.severity === 'warning');

		// Handle critical issues (expired)
		if (criticalIssues.length > 0) {
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
						issues: criticalIssues.map(i => ({ type: i.type, expirationDate: i.expirationDate }))
					}
				});

				logger.log(`[RESOLVER] Vehicle ${vehicleId}: transitioned to 'unmovable'`);
			}

			// Send expired notifications for each critical issue
			for (const issue of criticalIssues) {
				const documentType = getDocumentType(issue.type);
				const expiryDate = formatDate(issue.expirationDate);

				await sendVehicleDocumentExpiredNotification(driverContact, {
					documentName: "",
					expiryDate,
					registrationNumber: vehicle.registrationNumber,
					documentType
				}, 'health_check');

				// Also send to managers via incident matrix (handled automatically by notification system with admin: true)
				logger.log(`[RESOLVER] Vehicle ${vehicleId}: sent expired notification for ${documentType}`);
			}
		}

		// Handle warning issues (expiring soon)
		if (warningIssues.length > 0) {
			for (const issue of warningIssues) {
				const documentType = getDocumentType(issue.type);
				const expiryDate = formatDate(issue.expirationDate);
				const daysUntilExpiry = Math.ceil((new Date(issue.expirationDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));

				await sendVehicleDocumentExpiringNotification(driverContact, {
					documentName: "",
					expiryDate,
					daysUntilExpiry,
					registrationNumber: vehicle.registrationNumber,
					documentType
				}, 'health_check');

				logger.log(`[RESOLVER] Vehicle ${vehicleId}: sent expiring soon notification for ${documentType} (${daysUntilExpiry} days)`);
			}
		}
	}
}

function getDocumentType(type: string): VehicleDocumentType {
	switch (type) {
		case 'insurance_expiring':
			return 'insurance';
		case 'technical_expiring':
			return 'technical';
		default:
			return 'insurance';
	}
}

function formatDate(isoDate: string): string {
	return new Date(isoDate).toLocaleDateString('pl-PL');
}