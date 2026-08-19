import { VEHICLE_STATUS } from "$lib/assets/enums";
import { setItem, getItemById, getItems, updateItem } from "./firebase";

const collectionName: string = 'vehicles';

export const setVehicle = async (id: string, data: Partial<Vehicle.Vehicle>) => {
    return setItem(id, data, collectionName, true);
}

export const updateVehicle = async (id: string, data: Partial<Vehicle.Vehicle>) => {
    return updateItem(id, data, collectionName);
}

export const getVehicle = async <T=Vehicle.Vehicle> (id: string): Promise<T|null> => {
    return getItemById(id, collectionName);
}

export const findVehicles = async <T=Vehicle.Vehicle> (query: App.FirebaseItemsQuery = false, select: App.FirebaseItemsFields = false): Promise<T[]> => {
    return getItems(collectionName, query, select);
}

export const addNewVehicle = async (newVehicleData: Vehicle.NewVehicleData) => {
    const existing = await getItemById(newVehicleData.registrationNumber, collectionName);
    if (existing) {
        await setItem(newVehicleData.registrationNumber, newVehicleData, collectionName, true);
        return newVehicleData.registrationNumber;
    }

    const vehicle: Vehicle.Vehicle = {
        ...newVehicleData,
        status: VEHICLE_STATUS.Precheck,
        uberBoltTrips: {
            totalTrips: 0,
            totalEarnings: 0,
            avgDriverRating: 0,
            avgPassengerRating: 0
        },
        deliveryTrips: {
            completed: 0,
            totalDeliveryFees: 0
        },
        platformStatus: {}
    }
    await setItem(newVehicleData.registrationNumber, vehicle, collectionName);
    return newVehicleData.registrationNumber;
}