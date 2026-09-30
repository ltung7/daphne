import { sendNotification } from '../service';
import { 
    createDocumentExpiredDefinition, 
    createDocumentExpiringDefinition,
    type BaseDocumentExpiredData,
    type BaseDocumentExpiringData
} from '../general/baseDocumentNotifications';
import { getCategorizedBaseMessage } from '../localized/localizedMailerMessages';

export type VehicleDocumentType = 'registration' | 'insurance' | 'technical' | 'taxi_license' | 'platform' | 'equipment' | 'handover';

export interface VehicleDocumentExpiredData extends BaseDocumentExpiredData {
    registrationNumber: string;
    documentType: VehicleDocumentType;
}

export interface VehicleDocumentExpiringData extends BaseDocumentExpiringData {
    registrationNumber: string;
    documentType: VehicleDocumentType;
}

export const vehicleDocumentExpiredNotification = createDocumentExpiredDefinition<VehicleDocumentExpiredData>(
    'vehicle_document_expired',
    '/driver'
);

export const vehicleDocumentExpiringNotification = createDocumentExpiringDefinition<VehicleDocumentExpiringData>(
    'vehicle_document_expiring',
    '/driver'
);

// Override getBaseMessage to inject category name from message structure
vehicleDocumentExpiredNotification.getBaseMessage = getCategorizedBaseMessage;
vehicleDocumentExpiringNotification.getBaseMessage = getCategorizedBaseMessage;

/**
 * Dispatch the Vehicle Document Expired notification through all preferred channels.
 */
export async function sendVehicleDocumentExpiredNotification(user: App.BaseContact, data: Omit<VehicleDocumentExpiredData, 'documentType'> & { documentType: VehicleDocumentType }, incidentSource: App.Incident.Source = 'system'): Promise<void> {
    return sendNotification(user, vehicleDocumentExpiredNotification, data, incidentSource);
}

/**
 * Dispatch the Vehicle Document Expiring notification through all preferred channels.
 */
export async function sendVehicleDocumentExpiringNotification(user: App.BaseContact, data: Omit<VehicleDocumentExpiringData, 'documentType'> & { documentType: VehicleDocumentType }, incidentSource: App.Incident.Source = 'system'): Promise<void> {
    return sendNotification(user, vehicleDocumentExpiringNotification, data, incidentSource);
}