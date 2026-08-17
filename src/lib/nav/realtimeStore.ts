import { writable } from 'svelte/store';
import { initializeApp, getApps, getApp } from "firebase/app";
import { ref, onValue, getDatabase } from 'firebase/database';
import { PUBLIC_FIREBASE_PROJECT_ID, PUBLIC_FIREBASE_REALTIME_URL } from '$env/static/public';

const firebaseConfig = { projectId: PUBLIC_FIREBASE_PROJECT_ID, databaseURL: PUBLIC_FIREBASE_REALTIME_URL };
  
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const db = getDatabase(app);

export const getRealtimeStore = <T = any>(sid: string, prefix: string = 'status') => {
    const store = writable<T|null>(null);
    const dataRef = ref(db, [ prefix, sid ].join('/'));
    onValue(dataRef, (snapshot) => {
        store.set(snapshot.val());
    });
    return store;
}