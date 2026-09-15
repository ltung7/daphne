import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { getUser, setUser } from "$lib/server/db/firebase/users.fdb";
import { error } from '@sveltejs/kit';
import { handlePasswordResetEndpoint } from "$lib/server/services/users.service";

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
    return json({ success: true, user: updatedUser })
};

export const PATCH: RequestHandler = PUT;

export const DELETE: RequestHandler = async ({ params }) => {
    const user = await getUser<App.User>(params.id);
    if (!user) throw error(404, 'Nie znaleziono tego użytkownika');

    await setUser(params.id, { ...user, role: 'revoked', updatedAt: Date.now() });
    return json({ success: true })
};

export const POST: RequestHandler = async ({ params, request }) => {
    const body = await request.json();
    return handlePasswordResetEndpoint(params.id, body.action)
};