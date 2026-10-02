import { setItem, getItemById, updateItem } from "./firebase";
import type { SettingsGroups } from '$lib/types/settings-data';

const collectionName = 'settings';

function unflatten(obj: Record<string, any>): Record<string, any> {
    const result: Record<string, any> = {};
    for (const [ key, value ] of Object.entries(obj)) {
        if (!key.includes('.')) {
            result[key] = value;
            continue;
        }
        const parts = key.split('.');
        let current = result;
        for (let i = 0; i < parts.length - 1; i++) {
            const part = parts[i];
            if (!current[part] || typeof current[part] !== 'object') {
                current[part] = {};
            }
            current = current[part];
        }
        current[parts[parts.length - 1]] = value;
    }
    return result;
}

/**
 * Fetch a settings group document by its ID (groupName).
 */
export const getSettingsGroup = async <K extends keyof SettingsGroups>(groupName: K): Promise<SettingsGroups[K] | null> => {
    return getItemById<SettingsGroups[K]>(groupName, collectionName);
};

/**
 * Set (overwrite/create) a settings group document.
 */
export const setSettingsGroup = async <K extends keyof SettingsGroups>(groupName: K, data: SettingsGroups[K]) => {
    return setItem(groupName, data, collectionName, true); // merge = true
};

/**
 * Update specific fields in a settings group document using dot notation.
 * If the document is not found, falls back to setItem with merge.
 */
export const updateSettingsGroup = async (groupName: string, updates: Record<string, any>) => {
    try {
        return await updateItem(groupName, updates, collectionName);
    } catch {
        return await setItem(groupName, unflatten(updates), collectionName, true);
    }
};
