import { sendNotification } from '../service';
import { 
    createDocumentExpiredDefinition, 
    createDocumentExpiringDefinition,
    type BaseDocumentExpiredData,
    type BaseDocumentExpiringData
} from '../general/baseDocumentNotifications';

export interface VehicleDocumentExpiredData extends BaseDocumentExpiredData {
    registrationNumber: string;
}

export interface VehicleDocumentExpiringData extends BaseDocumentExpiringData {
    registrationNumber: string;
}

export const vehicleDocumentExpiredNotification = createDocumentExpiredDefinition<VehicleDocumentExpiredData>(
    'vehicle_document_expired',
    '/driver'
);

export const vehicleDocumentExpiringNotification = createDocumentExpiringDefinition<VehicleDocumentExpiringData>(
    'vehicle_document_expiring',
    '/driver'

);

/**
 * Dispatch the Vehicle Document Expired notification through all preferred channels.
 */
export async function sendVehicleDocumentExpiredNotification(user: App.BaseContact, data: VehicleDocumentExpiredData): Promise<void> {
    return sendNotification(user, vehicleDocumentExpiredNotification, data);
}

/**
 * Dispatch the Vehicle Document Expiring notification through all preferred channels.
 */
export async function sendVehicleDocumentExpiringNotification(user: App.BaseContact, data: VehicleDocumentExpiringData): Promise<void> {
    return sendNotification(user, vehicleDocumentExpiringNotification, data);
}
