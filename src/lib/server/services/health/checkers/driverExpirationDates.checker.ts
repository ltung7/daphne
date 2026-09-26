import { EXPIRATION_THRESHOLD } from '$lib/assets/constants';
import { findDrivers } from '$lib/server/db/firebase/drivers.fdb';

export const checkDriverExpirationDates: HealthCheck.HealthCheckFn = async (params?: HealthCheck.HealthCheckParams): Promise<HealthCheck.HealthIssue[]> => {
	const issues: HealthCheck.HealthIssue[] = [];

	const checkDate = new Date();
	checkDate.setDate(checkDate.getDate() + EXPIRATION_THRESHOLD);
	const checkDateStr = checkDate.toISOString().split('T')[0];

	const drivers = await findDrivers();

	for (const driver of drivers) {
		const driverName = driver.name || driver.id;

		for (const license of driver.drivingLicenses || []) {
			if (!license.expirationDate) continue;

			const daysLeft = Math.ceil((new Date(license.expirationDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));

			if (daysLeft <= EXPIRATION_THRESHOLD) {
				issues.push({
					id: `license-${driver.id}-${license.number}`,
					type: 'license_expiring',
					severity: daysLeft > 0 ? 'warning' : 'critical',
					entityType: 'driver',
					entityId: driver.id,
					expirationDate: license.expirationDate,
					driver: driverName
				});
			}
		}

		const taxiAuth = driver.taxiAuthorization;
		if (taxiAuth?.expirationDate) {
			const daysLeft = Math.ceil((new Date(taxiAuth.expirationDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));

			if (daysLeft <= EXPIRATION_THRESHOLD) {
				issues.push({
					id: `taxi-auth-${driver.id}`,
					type: 'taxi_authorization_expiring',
					severity: daysLeft > 0 ? 'warning' : 'critical',
					entityType: 'driver',
					entityId: driver.id,
					expirationDate: taxiAuth.expirationDate,
					driver: driverName
				});
			}
		}
	}

	return issues;
};