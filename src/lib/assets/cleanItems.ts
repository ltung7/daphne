export const cleanVehicle: Vehicle.NewVehicleData = {
    id: '',
    firstRegistrationDate: '',
    vin: '',
    mileage: 0,
    registrationNumber: '',
    insuranceExpiration: '',
    name: '',
    notes: '',
    technicalExpiration: '',
    modelMake: '',
    typeId: ''
}

export const cleanVehicleType: Vehicle.Type = {
    id: '',
    fuelType: 'gas',
    image: '',
    makeModel: '',
    name: '',
    eco: false,
    foodDelivery: false,
    maxPassengers: 4,
    premium: false,
    xl: false,
    taxClass: 'B',
    notes: ''
}