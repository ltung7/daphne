export const vehicleRequirements: Array<RideServices.RequirementItem> = [
    // ==========================================
    // DOCUMENTS
    // ==========================================
    {
        node: "registrationCertificateStamped",
        name: "Dowód rejestracyjny z pieczątką TAXI",
        text: "Dowód rejestracyjny pojazdu z oficjalnym wpisem / pieczątką 'TAXI' wydanym przez Wydział Komunikacji.",
        type: "document",
        service: [ "Uber", "Bolt", "FreeNow", "iTaxi" ],
        document: "registration_certificate"
    },
    {
        node: "taxiLicenseExcerpt",
        name: "Wypis z licencji TAXI",
        text: "Papierowy wypis z licencji na przewóz osób taksówką, wydany przez Urząd m.st. Warszawy dla konkretnego numeru rejestracyjnego.",
        type: "document",
        service: [ "Uber", "Bolt", "FreeNow", "iTaxi" ],
        document: "taxi_license_excerpt"
    },
    {
        node: "ocInsurancePolicy",
        name: "Ubezpieczenie OC TAXI",
        text: "Ważna polisa ubezpieczenia OC z wyraźnym zaznaczeniem, że pojazd służy do zarobkowego przewozu osób (TAXI).",
        type: "document",
        service: [ "Uber", "Bolt", "FreeNow", "iTaxi" ],
        document: "oc_insurance_policy"
    },
    {
        node: "technicalInspectionCertificate",
        name: "Zaświadczenie o badaniu technicznym TAXI",
        text: "Zaświadczenie z Okręgowej Stacji Kontroli Pojazdów potwierdzające zaliczenie rygorystycznego badania technicznego pod kątem TAXI.",
        type: "document",
        service: [ "Uber", "Bolt", "FreeNow", "iTaxi" ],
        document: "technical_inspection_certificate"
    },
    {
        node: "vehicleVerificationPhotos",
        name: "Zdjęcia weryfikacyjne pojazdu",
        text: "Zdjęcia ukazujące tablice rejestracyjne, oświetloną lampę 'TAXI' oraz naklejone oznakowanie miejskie Warszawy na drzwiach.",
        type: "document",
        service: [ "Uber", "Bolt", "FreeNow", "iTaxi" ],
        document: "vehicle_photo_exterior"
    },
    {
        node: "taximeterLegalizationCertificate",
        name: "Dowód legalizacji taksometru",
        text: "Świadectwo legalizacji taksometru i kasy fiskalnej zainstalowanej w samochodu.",
        type: "document",
        service: [ "iTaxi" ],
        document: "taximeter_legalization_certificate"
    },

    // ==========================================
    // CHECKS (Visual, Hardware & System Checks)
    // ==========================================
    {
        node: "warsawSideStripesCheck",
        name: "Oznakowanie: Żółto-czerwone pasy",
        text: "Czy pojazd posiada naklejone żółto-czerwone pasy (barwy m.st. Warszawy) na przednich drzwiach pod linią szyb?",
        type: "check",
        service: [ "Uber", "Bolt", "FreeNow", "iTaxi" ]
    },
    {
        node: "warsawCoatOfArmsCheck",
        name: "Oznakowanie: Herb Warszawy",
        text: "Czy pod żółto-czerwonym pasem na przednich drzwiach znajduje się oficjalny herb m.st. Warszawy?",
        type: "check",
        service: [ "Uber", "Bolt", "FreeNow", "iTaxi" ]
    },
    {
        node: "warsawSideNumberCheck",
        name: "Oznakowanie: Numer boczny TAXI",
        text: "Czy na przednich drzwiach umieszczono numer boczny w formacie 'Nr Licencji - Nr Wypisu'?",
        type: "check",
        service: [ "Uber", "Bolt", "FreeNow", "iTaxi" ],
        variable: "taxiRegistration"
    },
    {
        node: "tariffCardCheck",
        name: "Oznakowanie: Cennik taryf",
        text: "Czy oficjalna dwustronna naklejka z cennikiem jest umieszczona w prawym górnym rogu szyby tylnych prawych drzwi?",
        type: "check",
        service: [ "Uber", "Bolt", "FreeNow", "iTaxi" ]
    },
    {
        node: "rooftopLampCheck",
        name: "Lampa dachowa TAXI",
        text: "Czy pojazd posiada podświetlanego 'koguta' TAXI na dachu pojazdu?",
        type: "check",
        service: [ "Uber", "Bolt", "FreeNow", "iTaxi" ]
    },
    {
        node: "driverIdDisplayCheck",
        name: "Identyfikator kierowcy",
        text: "Czy identyfikator kierowcy taksówki jest wyeksponowany w kabinie, widoczny dla pasażerów?",
        type: "check",
        service: [ "Uber", "Bolt", "FreeNow", "iTaxi" ]
    },
    {
        node: "virtualCashRegisterActive",
        name: "Integracja wirtualnej kasy fiskalnej",
        text: "Czy aplikacja e-Kasa jest w pełni skonfigurowana i aktywna na profilu kierowcy w aplikacji?",
        type: "check",
        service: [ "Uber", "Bolt", "FreeNow" ]
    },
    {
        node: "hardwareTaximeterInstalled",
        name: "Instalacja sprzętu taksówkarskiego",
        text: "Czy pojazd został fizycznie wyposażony w taksometr, dedykowaną kasę fiskalną oraz terminal POS?",
        type: "check",
        service: [ "iTaxi" ]
    },
    {
        node: "bodyworkConditionCheck",
        name: "Stan blacharsko-lakierniczy",
        text: "Czy karoseria jest w 100% wolna od powypadkowych uszkodzeń, wgnieceń, ognisk rdzy oraz reklam konkurencyjnych sieci?",
        type: "check",
        service: [ "Uber", "Bolt", "FreeNow", "iTaxi" ]
    },
    {
        node: "leftHandDriveCheck",
        name: "Położenie kierownicy",
        text: "Czy kierownica znajduje się po lewej stronie pojazdu (LHD)?",
        type: "check",
        service: [ "Uber", "Bolt", "FreeNow", "iTaxi" ]
    },
    {
        node: "telemetryHardwareInstallation",
        name: "Fizyczny montaż lokalizatora GPS",
        text: "Czy moduł telemetrii/GPS został fizycznie zamontowany w pojeździe i podłączony do zasilania?",
        type: "check",
        service: [ "Uber", "Bolt", "FreeNow", "iTaxi" ]
    },
    {
        node: "telemetrySystemAssignment",
        name: "Przypisanie identyfikatora telemetrii",
        text: "Czy identyfikator zainstalowanego modułu telemetrii został powiązany z profilem pojazdu w systemie?",
        type: "check",
        service: [ "Uber", "Bolt", "FreeNow", "iTaxi" ],
        variable: "telemetryId"
    },
    {
        node: "fuelCardAssignment",
        name: "Przypisanie karty paliwowej",
        text: "Czy do pojazdu została przypisana unikalna karta flotowa (np. DKV) umożliwiająca bezgotówkowe tankowanie?",
        type: "check",
        service: [ "Uber", "Bolt", "FreeNow", "iTaxi" ],
        variable: "fuelCardId"
    },

    // ==========================================
    // CALCULATIONS (Calculated threshold requirements)
    // ==========================================
    {
        node: "maxVehicleAgeStandardUberBolt",
        name: "Maksymalny wiek pojazdu (Standard - Uber, Bolt)",
        text: "Maksymalny wiek samochodu w latach dla kategorii Standard w aplikacjach Uber i Bolt.",
        type: "calculate",
        service: [ "Uber", "Bolt" ],
        calculation_method: "years",
        value: 20,
        variable: "firstRegistrationDate"
    },
    {
        node: "maxVehicleAgeStandardFreeNow",
        name: "Maksymalny wiek pojazdu (Standard - FreeNow)",
        text: "Maksymalny wiek samochodu w latach dla kategorii Standard w aplikacji FreeNow.",
        type: "calculate",
        service: [ "FreeNow" ],
        calculation_method: "years",
        value: 17,
        variable: "firstRegistrationDate"
    },
    {
        node: "maxVehicleAgeStandardITaxi",
        name: "Maksymalny wiek pojazdu (Standard - iTaxi)",
        text: "Maksymalny wiek samochodu w latach dla floty iTaxi.",
        type: "calculate",
        service: [ "iTaxi" ],
        calculation_method: "years",
        value: 10,
        variable: "firstRegistrationDate"
    },
    {
        node: "maxVehicleAgeComfortUberBolt",
        name: "Maksymalny wiek pojazdu (Comfort - Uber, Bolt)",
        text: "Maksymalny wiek samochodu w latach dla kategorii podwyższonej (Comfort) w aplikacjach Uber i Bolt.",
        type: "calculate",
        service: [ "Uber", "Bolt" ],
        calculation_method: "years",
        value: 10,
        variable: "firstRegistrationDate"
    },
    {
        node: "maxVehicleAgeComfortFreeNow",
        name: "Maksymalny wiek pojazdu (Comfort - FreeNow)",
        text: "Maksymalny wiek samochodu w latach dla kategorii podwyższonej (Comfort) w aplikacji FreeNow.",
        type: "calculate",
        service: [ "FreeNow" ],
        calculation_method: "years",
        value: 5,
        variable: "firstRegistrationDate"
    },
    {
        node: "ocInsuranceExpirationBuffer",
        name: "Ważność polisy OC",
        text: "Minimalna liczba dni ważności ubezpieczenia OC TAXI w momencie dodawania dokumentu do systemu.",
        type: "calculate",
        service: [ "Uber", "Bolt", "FreeNow", "iTaxi" ],
        calculation_method: "days",
        value: 30,
        variable: "insuranceExpiration"
    },
    {
        node: "technicalInspectionExpirationBuffer",
        name: "Ważność badania technicznego",
        text: "Minimalna liczba dni ważności badania technicznego TAXI w momencie weryfikacji.",
        type: "calculate",
        service: [ "Uber", "Bolt", "FreeNow", "iTaxi" ],
        calculation_method: "days",
        value: 30,
        variable: "technicalExpiration"
    },
    {
        node: "minPassengerCapacity",
        name: "Minimalna liczba pasażerów",
        text: "Minimalna homologowana liczba pasażerów (nie licząc kierowcy), jaką pojazd musi przewozić.",
        type: "calculate",
        service: [ "Uber", "Bolt", "FreeNow", "iTaxi" ],
        calculation_method: "number",
        value: 4,
        variable: "maxPassengers"
    }
];

// ==========================================
// VALIDATION SUBFUNCTIONS
// ==========================================

/**
 * Validates if the required document type exists in the provided documents array.
 */
const validateDocumentRequirement = (
    requirement: RideServices.DocumentRequirement,
    documents: Vehicle.VehicleDocument[]
): boolean => {
    return documents.some((doc) => doc.type === requirement.document);
};

/**
 * Validates if the linked variable exists on the vehicle and is truthy.
 */
const validateCheckRequirement = (
    requirement: RideServices.CheckRequirement,
    vehicle: Vehicle.VehicleRequirementVerification
): boolean => {
    if (!requirement.variable) return false;
    return Boolean(vehicle[requirement.variable]);
};

/**
 * Validates calculated thresholds (days, years, number) using equal or more comparisons.
 */
const validateCalculateRequirement = (
    requirement: RideServices.CalculateRequirement,
    vehicle: Vehicle.VehicleRequirementVerification
): boolean => {
    const rawValue = vehicle[requirement.variable];
    if (rawValue === undefined || rawValue === null) return false;

    const now = new Date();

    switch (requirement.calculation_method) {
        case 'days': {
            const targetDate = new Date(rawValue as string);
            if (isNaN(targetDate.getTime())) return false;

            const diffInMs = targetDate.getTime() - now.getTime();
            const remainingDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

            // Remaining days must be equal to or more than required threshold
            return remainingDays >= requirement.value;
        }

        case 'years': {
            const regDate = new Date(rawValue as string);
            if (isNaN(regDate.getTime())) return false;

            const vehicleAgeYears = now.getFullYear() - regDate.getFullYear();

            // Max allowed age must be equal to or more than actual vehicle age
            return requirement.value >= vehicleAgeYears;
        }

        case 'number': {
            const numericValue = Number(rawValue);
            if (isNaN(numericValue)) return false;

            // Vehicle value must be equal to or more than required minimum
            return numericValue >= requirement.value;
        }

        default:
            return false;
    }
};

/**
 * Master dispatcher function to validate any requirement item.
 */
const validateRequirement = (
    requirement: RideServices.RequirementItem,
    vehicle: Vehicle.VehicleRequirementVerification,
    documents: Vehicle.VehicleDocument[]
): boolean => {
    switch (requirement.type) {
        case 'document':
            return validateDocumentRequirement(requirement, documents);
        case 'check':
            return validateCheckRequirement(requirement, vehicle);
        case 'calculate':
            return validateCalculateRequirement(requirement, vehicle);
        default:
            return false;
    }
};

/**
 * Verifies all requirement points for a given vehicle and document set.
 *
 * @param vehicle The target vehicle instance
 * @param documents Uploaded documents for the vehicle
 * @param requirements The requirement configuration dictionary (defaults to vehicleRequirements)
 * @returns A record mapping each RideServices.VerificationState key to its boolean pass/fail result
 */
export const verifyAllRequirements = (
    vehicle: Vehicle.VehicleRequirementVerification,
    documents: Vehicle.VehicleDocument[]
): Record<RideServices.VerificationState, boolean> => {
    return vehicleRequirements.reduce((acc, requirement) => {
        acc[requirement.node] = validateRequirement(requirement, vehicle, documents);
        return acc;
    }, {} as Record<RideServices.VerificationState, boolean>);
};