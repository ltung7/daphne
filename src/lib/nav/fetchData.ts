import { internal } from "./internal"

export const fetchVehicleTypes = async (fields?: (keyof Vehicle.Type)[]) => {
    const DEFAULT_FIELDS: (keyof Vehicle.Type)[] = [ 'name', 'eco', 'fuelType', 'image', 'makeModel', 'maxPassengers', 'notes', 'premium', 'taxClass' ];
    const fieldsString = (fields ?? DEFAULT_FIELDS).join(',')
    const response = await internal.get('/vehicletypes/api', { fields: fieldsString })
    return response.types as Vehicle.Type[];
}

export const fetchVehicles = async (fields?: (keyof Vehicle.Vehicle)[]) => {
    const DEFAULT_FIELDS: (keyof Vehicle.Vehicle)[] = [ 'name', 'assignedDriver', 'fuelCardId', 'imageUrl', 'firstRegistrationDate', 'notes', 'status', "registrationNumber" ];
    const fieldsString = (fields ?? DEFAULT_FIELDS).join(',')
    const response = await internal.get('/vehicles/api', { fields: fieldsString })
    return response.vehicles as Vehicle.Vehicle[];
}

export const fetchDrivers = async (fields?: (keyof Driver.Driver)[]) => {
    const DEFAULT_FIELDS: (keyof Driver.Driver)[] = [ 'name', 'notes', 'status', 'login', 'balance', 'phone' ];
    const fieldsString = (fields ?? DEFAULT_FIELDS).join(',')
    const response = await internal.get('/drivers/api', { fields: fieldsString })
    return response.vehicles as Driver.Driver[];
}