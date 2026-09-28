import { sendNotification } from '../service';
import { 
    createDocumentExpiredDefinition, 
    createDocumentExpiringDefinition,
    type BaseDocumentExpiredData,
    type BaseDocumentExpiringData
} from '../general/baseDocumentNotifications';

// Export specific driver types so they can be extended later if needed
export interface DriverDocumentExpiredData extends BaseDocumentExpiredData {
    driverId: string;
    driverName: string;
}

export interface DriverDocumentExpiringData extends BaseDocumentExpiringData {
    driverId: string;
    driverName: string;
}
export const driverDocumentExpiredNotification = createDocumentExpiredDefinition<DriverDocumentExpiredData>(
    'driver_document_expired',
    '/driver'
);

export const driverDocumentExpiringNotification = createDocumentExpiringDefinition<DriverDocumentExpiringData>(
    'driver_document_expiring',
    '/driver'
);

/**
 * Dispatch the Driver Document Expired notification through all preferred channels.
 */
export async function sendDriverDocumentExpiredNotification(user: App.BaseContact, data: DriverDocumentExpiredData, incidentSource: App.Incident.Source = 'system'): Promise<void> {
    return sendNotification(user, driverDocumentExpiredNotification, data, incidentSource);
}

/**
 * Dispatch the Driver Document Expiring notification through all preferred channels.
 */
export async function sendDriverDocumentExpiringNotification(user: App.BaseContact, data: DriverDocumentExpiringData, incidentSource: App.Incident.Source = 'system'): Promise<void> {
    return sendNotification(user, driverDocumentExpiringNotification, data, incidentSource);
}
