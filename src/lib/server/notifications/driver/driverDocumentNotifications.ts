import { sendNotification } from '../service';
import { 
    createDocumentExpiredDefinition, 
    createDocumentExpiringDefinition,
    type BaseDocumentExpiredData,
    type BaseDocumentExpiringData
} from '../general/baseDocumentNotifications';
import { getCategorizedBaseMessage } from '../localized/localizedMailerMessages';

export type DriverDocumentType = 'driving_license' | 'taxi_authorization' | 'identification' | 'medical';

export interface DriverDocumentExpiredData extends BaseDocumentExpiredData {
    driverId: string;
    driverName: string;
    documentType: DriverDocumentType;
}

export interface DriverDocumentExpiringData extends BaseDocumentExpiringData {
    driverId: string;
    driverName: string;
    documentType: DriverDocumentType;
}

export const driverDocumentExpiredNotification = createDocumentExpiredDefinition<DriverDocumentExpiredData>(
    'driver_document_expired',
    '/driver'
);

export const driverDocumentExpiringNotification = createDocumentExpiringDefinition<DriverDocumentExpiringData>(
    'driver_document_expiring',
    '/driver'
);

// Override getBaseMessage to inject category name from message structure
driverDocumentExpiredNotification.getBaseMessage = getCategorizedBaseMessage;
driverDocumentExpiringNotification.getBaseMessage = getCategorizedBaseMessage;

/**
 * Dispatch the Driver Document Expired notification through all preferred channels.
 */
export async function sendDriverDocumentExpiredNotification(user: App.BaseContact, data: Omit<DriverDocumentExpiredData, 'documentType'> & { documentType: DriverDocumentType }, incidentSource: App.Incident.Source = 'system'): Promise<void> {
    return sendNotification(user, driverDocumentExpiredNotification, data, incidentSource);
}

/**
 * Dispatch the Driver Document Expiring notification through all preferred channels.
 */
export async function sendDriverDocumentExpiringNotification(user: App.BaseContact, data: Omit<DriverDocumentExpiringData, 'documentType'> & { documentType: DriverDocumentType }, incidentSource: App.Incident.Source = 'system'): Promise<void> {
    return sendNotification(user, driverDocumentExpiringNotification, data, incidentSource);
}
