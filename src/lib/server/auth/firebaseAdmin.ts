import { getAuth } from 'firebase-admin/auth';
import { initialize } from '../db/firebase/firebase';

export function getFirebaseAuth() {
	const app = initialize();
	return getAuth(app);
}

export async function setCustomClaims(uid: string, claims: Record<string, any>) {
	const auth = getFirebaseAuth();
	await auth.setCustomUserClaims(uid, claims);
}

export async function getUserByEmail(email: string) {
	const auth = getFirebaseAuth();
	return auth.getUserByEmail(email);
}

export async function createUser(params: { email: string; password: string; displayName?: string }) {
	const auth = getFirebaseAuth();
	return auth.createUser(params);
}

export async function deleteUser(uid: string) {
	const auth = getFirebaseAuth();
	return auth.deleteUser(uid);
}

export async function updateUser(uid: string, params: { password?: string; displayName?: string; emailVerified?: boolean; disabled?: boolean }) {
	const auth = getFirebaseAuth();
	return auth.updateUser(uid, params);
}

export async function verifyIdToken(idToken: string) {
	const auth = getFirebaseAuth();
	return auth.verifyIdToken(idToken);
}

export async function createSessionCookie(idToken: string, expiresIn: number) {
	const auth = getFirebaseAuth();
	return auth.createSessionCookie(idToken, { expiresIn });
}

export async function verifySessionCookie(sessionCookie: string) {
	const auth = getFirebaseAuth();
	return auth.verifySessionCookie(sessionCookie, true);
}

export async function revokeRefreshTokens(uid: string) {
	const auth = getFirebaseAuth();
	return auth.revokeRefreshTokens(uid);
}

export async function generatePasswordResetLink(email: string) {
	const auth = getFirebaseAuth();
	return auth.generatePasswordResetLink(email);
}