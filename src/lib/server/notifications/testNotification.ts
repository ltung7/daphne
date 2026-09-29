import { sendNotification } from './service';
import type { NotificationDefinition } from './types';
import { 
    driverDocumentExpiredNotification, 
    driverDocumentExpiringNotification,
    type DriverDocumentExpiredData, 
    type DriverDocumentExpiringData 
} from './driver/driverDocumentNotifications';
import { 
    vehicleDocumentExpiredNotification, 
    vehicleDocumentExpiringNotification,
    type VehicleDocumentExpiredData, 
    type VehicleDocumentExpiringData 
} from './vehicle/vehicleDocumentNotifications';
import { pushEnabledNotification, type PushEnabledData } from './driver/pushEnabledNotification';
import { adminNotification, type AdminNotificationData } from './driver/adminNotification';
import { templateNotification, type TemplateNotificationData } from './driver/templateNotification';
import { earlySettlementRequestedNotification, type EarlySettlementRequestedData } from './driver/earlySettlementRequestedNotification';
import { earlySettlementApprovedNotification, type EarlySettlementApprovedData } from './driver/earlySettlementApprovedNotification';
import { earlySettlementRejectedNotification, type EarlySettlementRejectedData } from './driver/earlySettlementRejectedNotification';

const testReceiver: App.BaseContact = {
    email: 'tomasz.le@finnergroup.com',
    id: 'test-user',
    name: 'Tomasz',
    preferredLanguage: 'en',
    fcmToken: 'eNdK0UbOtIoDf8CGrgKLXX:APA91bEQymLhGKpGRbvtp1vcncOdBNvro4bH6m6ajQu8o7TGrDNbBoPgvrzm9ZekxCFAi1T90h3l64_q2TckoAagbZ143uD1lQQoyNDAEQ7iU38csNwr_Dc',
    phone: '+48506349870'
};

const notificationsMap: Partial<Record<App.NotificationType, NotificationDefinition<any>>> = {
    driver_document_expired: driverDocumentExpiredNotification,
    driver_document_expiring: driverDocumentExpiringNotification,
    vehicle_document_expired: vehicleDocumentExpiredNotification,
    vehicle_document_expiring: vehicleDocumentExpiringNotification,
    push_enabled: pushEnabledNotification,
    admin_notification: adminNotification,
    template_notification: templateNotification,
    early_settlement_requested: earlySettlementRequestedNotification,
    early_settlement_approved: earlySettlementApprovedNotification,
    early_settlement_rejected: earlySettlementRejectedNotification,
};

const defaultTestData: Record<App.NotificationType, any> = {
    /** TODO: Test notification */
    reset_password: {},

    /** No test */
    common: {},

    /** TODO: Test notification */
    driver_document_expired: {
        documentName: 'Driving License',
        expiryDate: '2023-12-31',
        driverId: 'drv_123',
        driverName: 'Jan Kowalski'
    } as DriverDocumentExpiredData,

    /** TODO: Test notification */
    driver_document_expiring: {
        documentName: 'Driving License',
        expiryDate: '2024-01-15',
        daysUntilExpiry: 14,
        driverId: 'drv_123',
        driverName: 'Jan Kowalski'
    } as DriverDocumentExpiringData,

    /** TODO: Test notification */
    vehicle_document_expired: {
        documentName: 'Vehicle Insurance',
        expiryDate: '2023-12-31',
        registrationNumber: 'WA12345'
    } as VehicleDocumentExpiredData,

    /** TODO: Test notification */
    vehicle_document_expiring: {
        documentName: 'Vehicle Insurance',
        expiryDate: '2024-01-15',
        daysUntilExpiry: 14,
        registrationNumber: 'WA12345'
    } as VehicleDocumentExpiringData,

    /** Tested 29.09 */
    push_enabled: {
        deviceDetails: 'iPhone 13, iOS 15'
    } as PushEnabledData,

    /** Tested 29.09 */
    admin_notification: {
        subject: 'Test Admin Alert',
        message: 'This is a test notification from the admin system.',
        channels: [ 'email', 'push' ]
    } as AdminNotificationData,

    /** Tested 29.09 */
    template_notification: {
        customField: 'Test Custom Field Value'
    } as TemplateNotificationData,

    /** Tested 29.09 */
    early_settlement_requested: {
        driverName: 'Jan Kowalski',
        requestedAmount: 500
    } as EarlySettlementRequestedData,

    /** Tested 29.09 */
    early_settlement_approved: {
        driverName: 'Jan Kowalski',
        requestedAmount: 500
    } as EarlySettlementApprovedData,

    /** Tested 29.09 */
    early_settlement_rejected: {
        driverName: 'Jan Kowalski',
        requestedAmount: 500
    } as EarlySettlementRejectedData
};

export const sendTestNotification = async <TData = any>(
    notificationId: App.NotificationType,
    data?: TData
) => {
    const notification = notificationsMap[notificationId];
    if (!notification) {
        throw new Error(`Notification definition not found for id: ${notificationId}`);
    }
    const payload = data ?? (defaultTestData[notificationId] as TData);
    return sendNotification(testReceiver, notification, payload);
};
