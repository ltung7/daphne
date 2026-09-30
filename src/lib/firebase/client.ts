import {
	PUBLIC_FIREBASE_APIKEY,
	PUBLIC_FIREBASE_AUTH_DOMAIN,
	PUBLIC_FIREBASE_PROJECT_ID,
	PUBLIC_FIREBASE_STORAGE_BUCKET,
	PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
	PUBLIC_FIREBASE_APP_ID,
	PUBLIC_FIREBASE_MEASUREMENT
} from '$env/static/public';
import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getMessaging, getToken, onMessage, deleteToken, type Messaging } from 'firebase/messaging';

const firebaseConfig = {
	apiKey: PUBLIC_FIREBASE_APIKEY,
	authDomain: PUBLIC_FIREBASE_AUTH_DOMAIN,
	projectId: PUBLIC_FIREBASE_PROJECT_ID,
	storageBucket: PUBLIC_FIREBASE_STORAGE_BUCKET,
	messagingSenderId: PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
	appId: PUBLIC_FIREBASE_APP_ID,
	measurementId: PUBLIC_FIREBASE_MEASUREMENT
};

// Single Firebase App instance for client SDK (browser only)
let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let messaging: Messaging | null = null;

if (!import.meta.env.SSR) {
	if (!getApps().length) {
		app = initializeApp(firebaseConfig);
	} else {
		app = getApps()[0];
	}
	auth = getAuth(app);
	messaging = getMessaging(app);
}

export { app, auth, messaging, getToken, onMessage, deleteToken };