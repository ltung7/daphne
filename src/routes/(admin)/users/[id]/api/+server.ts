import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { getUser, setUser } from "$lib/server/db/firebase/users.fdb";
import { error } from '@sveltejs/kit';
import { handlePasswordResetEndpoint } from "$lib/server/services/users.service";
import { revokeRefreshTokens, setCustomClaims } from '$lib/server/auth/firebaseAdmin.js';

export const GET: RequestHandler = async ({ params }) => {
    const user = await getUser<App.User>(params.id);
    if (!user) throw error(404, 'Nie znaleziono tego użytkownika');
    return json({ success: true, user })
};

export const PUT: RequestHandler = async ({ params, request }) => {
    const data = await request.json() as Partial<App.User>;
    const user = await getUser<App.User>(params.id);
    if (!user) throw error(404, 'Nie znaleziono tego użytkownika');

    const updatedUser = { ...user, ...data, updatedAt: Date.now() };
    await setUser(params.id, updatedUser);

    // Sync Firebase custom claims if role changed
    if (data.role && data.role !== user.role) {
        await setCustomClaims(params.id, { role: data.role });
    }

    return json({ success: true, user: updatedUser })
};

export const PATCH: RequestHandler = PUT;

export const DELETE: RequestHandler = async ({ params }) => {
    const user = await getUser<App.User>(params.id);
    if (!user) throw error(404, 'Nie znaleziono tego użytkownika');

    await setUser(params.id, { ...user, role: 'revoked', updatedAt: Date.now() });
    
    // Revoke Firebase tokens and set custom claims for immediate effect
    await revokeRefreshTokens(params.id);
    await setCustomClaims(params.id, { role: 'revoked' });
    
    return json({ success: true })
};

export const POST: RequestHandler = async ({ params, request }) => {
    const body = await request.json();
    return handlePasswordResetEndpoint(params.id, body.action)
};