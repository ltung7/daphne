import { getDriver, updateDriver } from '$lib/server/db/firebase/drivers.fdb';
import { sendDocumentExpiringNotification } from '$lib/server/notifications/driver/documentExpiringNotification';
import { sendDocumentExpiredNotification } from '$lib/server/notifications/driver/documentExpiredNotification';

/**
 * Resolves driver expiration health issues.
 * - warning severity (expiring soon): send documentExpiringNotification
 * - critical severity (expired): update driver status to 'documents_expired' + send documentExpiredNotification
 */
export async function resolveDriverExpirationIssues(
	issues: HealthCheck.HealthIssue[],
	params: HealthCheck.HealthCheckParams
): Promise<void> {
	const driverIssues = issues.filter(i => i.entityType === 'driver');

	// Group by driver
	const byDriver = new Map<string, HealthCheck.HealthIssue[]>();
	for (const issue of driverIssues) {
		const existing = byDriver.get(issue.entityId) || [];
		existing.push(issue);
		byDriver.set(issue.entityId, existing);
	}

	// Build driver lookup from params first
	const driversFromParams = new Map<string, Driver.Driver>();
	if (params.drivers?.length) {
		for (const d of params.drivers) {
			driversFromParams.set(d.id, d);
		}
	}

	for (const [ driverId, driverIssues ] of byDriver) {
		// Try to get driver from params first, fallback to query
		let driver = driversFromParams.get(driverId) ?? null;
		if (!driver) {
			driver = await getDriver(driverId);
		}
		if (!driver) {
			console.warn(`[RESOLVER] Driver ${driverId} not found, skipping`);
			continue;
		}

		const contact: App.BaseContact = {
			id: driver.id,
			email: driver.email,
			name: driver.name,
			preferredLanguage: driver.preferredLanguage,
			phone: driver.phone,
			fcmToken: driver.fcmToken
		};

		const hasCritical = driverIssues.some(i => i.severity === 'critical');
		const hasWarning = driverIssues.some(i => i.severity === 'warning');

		if (hasCritical) {
			// Critical: update driver status to 'documents_expired' + send expired notification
			for (const issue of driverIssues.filter(i => i.severity === 'critical')) {
				const documentName = getDocumentName(issue.type);
				const expiryDate = formatDate(issue.expirationDate);

				await sendDocumentExpiredNotification(contact, {
					documentName,
					expiryDate
				});
			}

			// Update driver status if not already 'documents_expired'
			if (driver.status !== 'documents_expired') {
				await updateDriver(driverId, { status: 'documents_expired' });
				console.log(`[RESOLVER] Driver ${driverId}: status updated to 'documents_expired'`);
			}
		} else if (hasWarning) {
			// Warning: send expiring soon notification only
			for (const issue of driverIssues.filter(i => i.severity === 'warning')) {
				const documentName = getDocumentName(issue.type);
				const expiryDate = formatDate(issue.expirationDate);
				const daysUntilExpiry = Math.ceil((new Date(issue.expirationDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));

				await sendDocumentExpiringNotification(contact, {
					documentName,
					expiryDate,
					daysUntilExpiry
				});
			}
		}
	}
}

function getDocumentName(type: string): string {
	switch (type) {
		case 'license_expiring':
			return 'Kierowców';
		case 'taxi_authorization_expiring':
			return 'Upoważnienia taksówki';
		default:
			return 'Dokumentu';
	}
}

function formatDate(isoDate: string): string {
	return new Date(isoDate).toLocaleDateString('pl-PL');
}