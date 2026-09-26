/// <reference lib="webworker" />

import { initializeApp } from 'firebase/app';
import { getMessaging, onBackgroundMessage } from 'firebase/messaging/sw';
import {
    PUBLIC_FIREBASE_APIKEY,
    PUBLIC_FIREBASE_AUTH_DOMAIN,
    PUBLIC_FIREBASE_PROJECT_ID,
    PUBLIC_FIREBASE_STORAGE_BUCKET,
    PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    PUBLIC_FIREBASE_APP_ID,
    PUBLIC_FIREBASE_MEASUREMENT,
    PUBLIC_FIREBASE_REALTIME_URL
} from '$env/static/public';

const firebaseConfig = {
    apiKey: PUBLIC_FIREBASE_APIKEY,
    authDomain: PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: PUBLIC_FIREBASE_APP_ID,
    measurementId: PUBLIC_FIREBASE_MEASUREMENT,
    databaseURL: PUBLIC_FIREBASE_REALTIME_URL
};

// Initialize Firebase App in the service worker
const app = initializeApp(firebaseConfig);
const messaging = getMessaging(app);

// Handle background messages
onBackgroundMessage(messaging, (payload) => {
    const notificationTitle = payload.notification?.title || 'Notification';
    const notificationOptions = {
        body: payload.notification?.body,
        icon: 'https://eisg.pl/wp-content/uploads/2015/12/eisg_logo.png'
    };

    // Need to cast `self` to ServiceWorkerGlobalScope to access registration
    (self as unknown as ServiceWorkerGlobalScope).registration.showNotification(
        notificationTitle,
        notificationOptions
    );
});
