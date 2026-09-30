import { addItem, getItems, updateItem, getItemById } from './firebase';

const collectionName = 'userNotifications';

export const addNotification = async (notification: Omit<App.InAppNotification, 'id'>) => {
    return addItem(notification, collectionName);
}

export const getUserNotifications = async (userId: string): Promise<App.InAppNotification[]> => {
    return getItems(collectionName, { userId }, false, [ 'timestamp', 'desc' ]);
}

export const markNotificationRead = async (notificationId: string) => {
    return updateItem(notificationId, { read: Date.now() }, collectionName);
}

export const markAllNotificationsRead = async (userId: string) => {
    const unread = await getItems<App.InAppNotification>(collectionName, [ [ 'userId', '==', userId ], [ 'read', '==', false ] ]);
    const promises = unread.map(n => updateItem(n.id, { read: Date.now() }, collectionName));
    await Promise.allSettled(promises);
}

export const getNotification = async (id: string): Promise<App.InAppNotification | null> => {
    return getItemById(id, collectionName);
}

export const updateNotification = async (id: string, data: Partial<App.InAppNotification>) => {
    return updateItem(id, data, collectionName);
}
