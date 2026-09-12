export const cleanVehicle: Vehicle.NewVehicleData = {
    id: '',
    fuelType: 'gas',
    transmission: 'manual',
    firstRegistrationDate: '',
    vin: '',
    mileage: 0,
    registrationNumber: '',
    insuranceExpiration: '',
    name: '',
    notes: '',
    technicalExpiration: '',
    modelMake: '',
    typeId: '',
    color: 'black'
}

export const cleanVehicleType: Vehicle.Type = {
    id: '',
    fuelType: 'gas',
    transmission: 'manual',
    requiredDrivingLicense: 'B',
    image: '',
    makeModel: '',
    name: '',
    eco: false,
    foodDelivery: false,
    seats: 5,
    premium: false,
    xl: false,
    notes: ''
}

export const cleanDriver: Driver.NewDriverData = {
    id: '',
    name: '',
    sex: 'm',
    phone: '',
    email: '',
    pesel: '',
    address: '',
    drivingLicenses: [],
    polishLanguage: 'basic',
    nationality: 'pl',
    identificationDocumentType: 'passport',
    identificationDocumentNumber: '',
    notes: '',
    additionalLanguages: {},
    preferredLanguage: 'en'
}

export const cleanHandoverProtocol: DocumentGenerator.HandoverDocument = {
    place: 'Warszawa',
    date: new Date().toLocaleDateString('en-CA'),
    owner: 'APT, NIP 1234567890',
    managerName: '',
    managerEmail: '',
    driverName: '',
    driverId: '',
    identificationDocumentNumber: '',
    identificationDocumentType: 'passport',
    driverEmail: '',
    model: '',
    registrationNumber: '',
    vin: '',
    milage: '',
    remaining: '100%',
    isElectric: false,
    locale: 'pl',
    key: true,
    spareKey: false,
    registration: false,
    roofSign: true,
    tire: true,
    fuelCard: true,
    exinguisher: true,
    triangle: true,
    firstAidKit: true,
    vest: true,
    mats: true,
    phoneHolder: false,
    phoneCharger: false,
    carWashCard: false,
    visual: 'Brak uwag - pojazd czysty i sprawny',
    translatedVisual: '',
    images: []
}

export const cleanUser: App.User = {
    id: '',
    name: '',
    email: '',
    role: 'moderator',
    preferredLanguage: 'pl',
    timestamp: Date.now(),
    updatedAt: Date.now(),
    lastLoggedIn: 0,
    canSignHandovers: false
}