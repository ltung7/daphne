import type { StatusBarData } from "$lib/server/services/firestatus.service";
import { setItem, getItemById } from "./firebase";

const collectionName: string = 'status';

export const getCurrentStatusBar = async (accountId: string, index: string): Promise<any> => {
    const collectionPath: string = [ collectionName, 'current', accountId ].join('/');
    return getItemById(index, collectionPath);
}

export const setCurrentStatusBar = async (accountId: string, index: string, data: StatusBarData) => {
    const collectionPath: string = [ collectionName, 'current', accountId ].join('/');
    return setItem(index, data, collectionPath);
}