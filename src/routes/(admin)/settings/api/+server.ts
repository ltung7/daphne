import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { updateSettingsGroup } from '$lib/server/db/firebase/settings.fdb';

export const POST: RequestHandler = async ({ request, locals }) => {
    if (!locals._user) {
        throw error(401, 'Brak autoryzacji');
    }

    if (locals._user.role !== 'admin') {
        throw error(403, 'Brak uprawnień administratora');
    }

    const body = await request.json();

    // Support multiple formats:
    // 1. { path: 'company.finances.provisionRate', value: 0.50 }
    // 2. { patch: { 'company.finances.provisionRate': 0.50 } }
    // 3. Direct key-values: { 'company.finances.provisionRate': 0.50 }
    const patch: Record<string, any> =
        body.patch ?? (body.path ? { [body.path]: body.value } : body);

    const updatesByGroup: Record<string, Record<string, any>> = {};

    for (const [ key, value ] of Object.entries(patch)) {
        if (typeof key !== 'string' || !key.includes('.')) continue;

        const firstDot = key.indexOf('.');
        const groupName = key.slice(0, firstDot);
        const fieldPath = key.slice(firstDot + 1);

        if (!updatesByGroup[groupName]) {
            updatesByGroup[groupName] = {};
        }
        updatesByGroup[groupName][fieldPath] = value;
    }

    if (Object.keys(updatesByGroup).length === 0) {
        return json({ success: true, message: 'Brak zmian do zapisania' });
    }

    for (const [ groupName, groupUpdates ] of Object.entries(updatesByGroup)) {
        await updateSettingsGroup(groupName, groupUpdates);
    }

    return json({ success: true, message: 'Ustawienia zostały pomyślnie zapisane' });
};

export const PATCH: RequestHandler = POST;
