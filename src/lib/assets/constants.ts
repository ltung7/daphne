export const fuelNames: Record<Vehicle.FuelType, string> = {
    gas: "Benzyna",
    hybrid: "Hybryda",
    electric: "Elektryczny",
    phev: "Hybryda plug-in",
    mhev: "Miękka hybryda",
    diesel: "Diesel",
    cng: "Gaz ziemny (CNG)",
    "hybrid-gas": "Hybryda benzynowa",
    "mhev-diesel": "Miękka hybryda diesel",
    ethanol: "Etanol",
    "hybrid-diesel": "Hybryda diesel",
    lpg: "Gaz płynny (LPG)",
    hydrogen: "Wodór"
}

export const vehicleDocumentNames: Record<Vehicle.DocumentType, string> = {
    // Registration & ownership
    registration_certificate: 'Dowód rejestracyjny',
    ownership_proof: 'Dowód własności',
    lease_agreement: 'Umowa leasingu / najmu',
    taxi_license_excerpt: 'Wypis z licencji TAXI',

    // Insurance
    oc_insurance_policy: 'Polisa ubezpieczeniowa OC',
    ac_insurance_policy: 'Polisa ubezpieczeniowa AC',

    // Technical / safety
    technical_inspection_certificate: 'Zaświadczenie o badaniu technicznym',
    internal_checkup_report: 'Raport z przeglądu wewnętrznego',
    damage_incident_report: 'Protokół zgłoszenia szkody',
    vehicle_history: "Historia pojazdu",

    // Fleet-level licensing
    fleet_taxi_license: 'Licencja TAXI dla floty',
    taxi_marking_confirmation: 'Potwierdzenie oznakowania TAXI',

    // Platform onboarding
    vehicle_photo_exterior: 'Zdjęcie pojazdu z zewnątrz',
    vehicle_photo_interior: 'Zdjęcie wnętrza pojazdu',
    platform_approval_uber: 'Zatwierdzenie w platformie Uber',
    platform_approval_bolt: 'Zatwierdzenie w platformie Bolt',
    platform_approval_freenow: 'Zatwierdzenie w platformie FreeNow',

    // Equipment
    telematics_installation_certificate: 'Zaświadczenie o montażu telematyki',
    fuel_card_agreement: 'Umowa o kartę paliwową',
    taximeter_legalization_certificate: 'Świadectwo legalizacji taksometru',

    vehicle_handover_document: "Protokół wydania pojazdu",
    vehicle_handover_return_document: 'Protokół zwrotu pojazdu',
    vehicle_handover_unilateral_document: 'Protokół jednostronnego odbioru pojazdu'
}

export const driverDocumentNames: Record<Driver.DocumentType, string> = {
    // Driving qualifications
    driving_license_front: 'Prawo jazdy (przód)',
    driving_license_back: 'Prawo jazdy (tył)',

    // Personal identification
    id_card_front: 'Dowód osobisty (przód)',
    id_card_back: 'Dowód osobisty (tył)',
    residence_permit_front: 'Karta pobytu (przód)',
    residence_permit_back: 'Karta pobytu (tył)',
    passport_main_page: 'Paszport (strona ze zdjęciem)',

    // Background checks
    polish_criminal_record_certificate: 'Zaświadczenie o niekaralności (KRK)',
    foreign_criminal_record_certificate: 'Zagraniczne zaświadczenie o niekaralności',

    // Medical approvals
    medical_certificate: 'Orzeczenie lekarskie',
    psychological_certificate: 'Orzeczenie psychologiczne',

    // City TAXI permissions
    taxi_driver_id_front: 'Identyfikator kierowcy TAXI (przód)',
    taxi_driver_id_back: 'Identyfikator kierowcy TAXI (tył)',
    taxi_driver_id_decision: 'Decyzja o wydaniu identyfikatora TAXI'
};

export const identificationDocumentNames: Record<Driver.IdentificationDocumentType, string> = {
    polish_id_card: 'Dowód osobisty',
    passport: 'Paszport',
    residence_card: 'Karta pobytu',
    temporary_residence_card: 'Tymczasowa karta pobytu',
    travel_document: 'Document podróży',
}

interface VehicleDocumentCategory {
    name: string;
    fields: Vehicle.DocumentType[]
}

export const vehicleDocumentCategories: Array<VehicleDocumentCategory> = [
    {
        name: 'Rejestracja i licencje',
        fields: [
            'registration_certificate',
            'taxi_license_excerpt',
            'fleet_taxi_license',
            'taxi_marking_confirmation',
        ],
    },
    {
        name: 'Świadectwa i certyfikaty',
        fields: [
            'oc_insurance_policy',
            'ac_insurance_policy',
            'fuel_card_agreement',
            'taximeter_legalization_certificate',
        ],
    },
    {
        name: 'Stan pojazdu',
        fields: [
            'technical_inspection_certificate',
            'internal_checkup_report',
            'damage_incident_report',
            'vehicle_photo_exterior',
            'vehicle_photo_interior',
        ],
    },
    {
        name: 'Aplikacje i wyposażenie',
        fields: [
            'platform_approval_uber',
            'platform_approval_bolt',
            'platform_approval_freenow',
            'telematics_installation_certificate',
        ],
    },
];

interface DriverDocumentCategory {
    name: string;
    fields: Driver.DocumentType[]
}

export const driverDocumentCategories: Array<DriverDocumentCategory> = [
    {
        name: 'Uprawnienia i licencje',
        fields: [
            'driving_license_front',
            'driving_license_back',
            'taxi_driver_id_front',
            'taxi_driver_id_back',
        ],
    },
    {
        name: 'Tożsamość i prawo pobytu',
        fields: [
            'id_card_front',
            'id_card_back',
            'residence_permit_front',
            'residence_permit_back',
            'passport_main_page',
        ],
    },
    {
        name: 'Zaświadczenia o niekaralności',
        fields: [
            'polish_criminal_record_certificate',
            'foreign_criminal_record_certificate',
        ],
    },
    {
        name: 'Badania lekarskie i psychologiczne',
        fields: [
            'medical_certificate',
            'psychological_certificate',
        ],
    },
];
export const updatableVehicleVariables: Array<keyof Vehicle.Vehicle> = [ 'insuranceExpiration', 'technicalExpiration', 'firstRegistrationDate' ];

export const vehicleVariableNames: Partial<Record<keyof Vehicle.Vehicle, string>> = {
    insuranceExpiration: 'Ważność polisy ubezpieczeniowej',
    technicalExpiration: 'Ważność badania technicznego',
    firstRegistrationDate: 'Data pierwszej rejestracji'
}

export const languages: Array<[string, string, string, string]> = [
    [ 'en', 'en', 'Angielski', 'English' ],
    [ 'hi', 'in', 'Hindi', 'हिन्दी' ],
    [ 'cs', 'cz', 'Czeski', 'Čeština' ],
    [ 'ne', 'ne', 'Nepalski', 'नेपाली' ],
    [ 'hr', 'hr', 'Chorwacki', 'Hrvatski' ],
    [ 'uk', 'ua', 'Ukraiński', 'Українська' ],
    [ 'be', 'by', 'Białoruski', 'Беларуская' ],
    [ 'tl', 'ph', 'Filipiński', 'Filipino' ],
    [ 'es', 'co', 'Hiszpański', 'Español' ],
    [ 'uz', 'uz', 'Uzbecki', 'Oʻzbekcha' ],
    [ 'bn', 'bd', 'Bengalski', 'বাংলা' ],
    [ 'ka', 'ge', 'Gruziński', 'ქართული' ],
    [ 'ro', 'md', 'Rumuński', 'Română' ],
]

export const languageLevels: Record<string, string> = {
    basic: 'Podstawowy',
    fluent: 'Biegły',
    native: 'Ojczysty'
}

export const countryNames: Record<string, string> = {
    pl: 'Polska',
    gb: 'Wielka Brytania',
    in: 'Indie',
    cz: 'Czechy',
    np: 'Nepal',
    hr: 'Chorwacja',
    ua: 'Ukraina',
    by: 'Białoruś',
    ph: 'Filipiny',
    co: 'Kolumbia',
    uz: 'Uzbekistan',
    bd: 'Bangladesz',
    ge: 'Gruzja',
    md: 'Mołdawia',
};