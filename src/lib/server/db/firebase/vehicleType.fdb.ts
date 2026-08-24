import { setItem, getItemById, getItems, updateItem } from "./firebase";

export const setVehicleType = async (id: string, data: Partial<Vehicle.Type>) => {
    return setItem(id, data, 'vehicleType');
}

export const updateVehicleType = async (id: string, data: Partial<Vehicle.Type>) => {
    return updateItem(id, data, 'vehicleType');
}

export const getVehicleType = async <T=Vehicle.Type> (id: string): Promise<T|null> => {
    return getItemById(id, 'vehicleType');
}

export const findVehicleType = async <T=Vehicle.Type> (query: App.FirebaseItemsQuery<keyof Vehicle.Type> = false, select: App.FirebaseItemsFields = false): Promise<T[]> => {
    return getItems('vehicleType', query, select);
}