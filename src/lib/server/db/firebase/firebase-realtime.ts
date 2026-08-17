import firebaseAdmin from 'firebase-admin';
import { initialize } from './firebase';

let db: null | firebaseAdmin.database.Database;

export const initializeRealitimeDatabase = (): firebaseAdmin.database.Database => {
    if (db) return db;
    initialize();
    db = firebaseAdmin.database();
    return db;
}

export const getRealitimeRef = (id: string) => {
    if (!db) db = initializeRealitimeDatabase();
    return db.ref(id);
}