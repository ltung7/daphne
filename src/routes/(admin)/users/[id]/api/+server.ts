import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { getUser, setUser } from "$lib/server/db/firebase/users.fdb";
import { error } from '@sveltejs/kit';

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

export const DELETE: RequestHandler = async ({ params }) => {
    const user = await getUser<App.User>(params.id);
    if (!user) throw error(404, 'Nie znaleziono tego użytkownika');
    
    // For soft delete, we could just mark as revoked instead of actual deletion
    await setUser(params.id, { ...user, role: 'revoked', updatedAt: Date.now() });
    return json({ success: true })
};