import { DRIVER_STATUS } from "$lib/assets/enums";
import hash from "$lib/server/secure/hash";
import randomString from "$lib/utils/randomString";
import { setItem, getItemById, getItems, addItem, countItems } from "./firebase";

const collectionName: string = 'vehicleDriver';

export const setDriver = async (id: string, data: Partial<Driver.Driver>) => {
    return setItem(id, data, collectionName, true);
}

export const getDriver = async <T=Driver.Driver> (id: string): Promise<T|null> => {
    return getItemById(id, collectionName);
}

export const findDrivers = async <T=Driver.Driver> (query: App.FirebaseItemsQuery<keyof Driver.Driver> = false, select: App.FirebaseItemsFields = false): Promise<T[]> => {
    return getItems(collectionName, query, select);
}

export const countDrivers = async (query: App.FirebaseItemsQuery<keyof Driver.Driver> = false): Promise<number> => {
    return countItems(collectionName, query);
}

export const addNewDriver = async (newDriverData: Driver.NewDriverData) => {
    if (newDriverData.id.length) {
        const existing = await getItemById(newDriverData.id, collectionName);
        if (existing) {
            await setItem(newDriverData.id, newDriverData, collectionName, true);
            return newDriverData;
        }
    }

    if (newDriverData.login.length) {
        const existing = await countDrivers({ login: newDriverData.login });
        if (existing) throw new Error("Login already in use")
    }

    const password = randomString(12, false);
    const encrypted = hash(password, 'sha-256');
    const driver: Driver.Driver = {
        ...newDriverData,
        status: DRIVER_STATUS.PendingVerification,
        balance: 0,
        assignedVehicle: false,
        earnings: 0,
        experience: 0,
        passengerRatings: 0,
        password: encrypted,
        pendingWithdrawals: 0,
        profileImageUrl: '',
        safetyScore: 0,
        tripsCompleted: 0,
        uptimePercentage: 0,
    }
    console.log({ driver, collectionName })
    const id = await addItem(driver, collectionName);
    console.log({ id })
    if (!id) throw new Error("Error adding new driver")
    return { id, password };
}