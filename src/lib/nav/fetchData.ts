import { internal } from "./internal"

export const fetchVehicleTypes = async (fields?: (keyof Vehicle.Type)[]) => {
    const DEFAULT_FIELDS: (keyof Vehicle.Type)[] = [ 'id', 'name', 'eco', 'fuelType', 'image', 'makeModel', 'maxPassengers', 'notes', 'premium', 'taxClass' ];
    const fieldsString = (fields ?? DEFAULT_FIELDS).join(',')
    const response = await internal.get('/vehicletypes/api', { fields: fieldsString })
    return response.types as Vehicle.Type[];
}

export const fetchVehicles = async (fields?: (keyof Vehicle.Vehicle)[]) => {
    const DEFAULT_FIELDS: (keyof Vehicle.Vehicle)[] = [ 'id', 'name', 'assignedDriver', 'fuelCardId', 'imageUrl', 'firstRegistrationDate', 'notes', 'status', "registrationNumber" ];
    const fieldsString = (fields ?? DEFAULT_FIELDS).join(',')
    const response = await internal.get('/vehicles/api', { fields: fieldsString })
    return response.vehicles as Vehicle.Vehicle[];
}