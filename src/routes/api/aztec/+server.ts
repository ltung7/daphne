import { ECO_FUEL_TYPES } from '$lib/assets/enums';
import { findVehicleType, setVehicleType } from '$lib/server/db/firebase/vehicleType.fdb';
import { error, json } from '@sveltejs/kit'
import {
    PolishVehicleRegistrationCertificateDecoder,
    PolishVehicleRegistrationCertificateNewFormatData,
    PolishVehicleRegistrationCertificateOldFormatData
} from 'polish-vehicle-registration-certificate-decoder'

const FUEL_MAP: Record<string, Vehicle.FuelType> = {
    // Pojedyncze źródła zasilania
    P: "gas",
    D: "diesel",
    EE: "electric",
    LPG: "lpg",
    CNG: "cng",
    LNG: "cng",
    H: "hydrogen",
    M: "gas",
    BD: "diesel",
    E85: "ethanol",

    // Układy dwupaliwowe i hybrydy
    "P/EE": "hybrid-gas",
    "D/EE": "hybrid-diesel",
    "P/LPG": "lpg",
    "P/CNG": "cng",

    // Archiwalne kody z dowodów rejestracyjnych
    BB: "gas",
    BU: "gas",
    ON: "diesel",
};

export interface DanePojazdu {
    kategoriaPojazdu?: string;          // Pole J (np. "M1", "N1", "L3e", "L6e", "T")
    dopuszczalnaMasaCalkowita?: number;  // Pole F.2 (w kg)
    pojemnoscSilnika?: number;           // Pole P.1 (w cm³)
    mocNetto?: number;                   // Pole P.2 (w kW)
    masaWlasna?: number;                 // Pole G (w kg)
    liczbaMiejsc?: number;               // Pole S.1 (liczba miejsc siedzących)
}

function discernDriverLicense({
    kategoriaPojazdu = "",
    dopuszczalnaMasaCalkowita = 0,
    pojemnoscSilnika = 0,
    mocNetto = 0,
    masaWlasna = 0,
    liczbaMiejsc = 0,
}: DanePojazdu): Driver.DrivingLicenseCategory {
    const kat = kategoriaPojazdu.toUpperCase().trim();
    const stosunekMocyDoMasy = masaWlasna > 0 ? mocNetto / masaWlasna : 0;

    // 1. Autobusy (przewóz więcej niż 8 pasażerów + kierowca)
    if (liczbaMiejsc > 9) {
        return liczbaMiejsc <= 17 ? "D1" : "D";
    }

    // 2. Ciągniki rolnicze i pojazdy wolnobieżne
    if (kat.startsWith("T") || kat === "C") {
        return "T";
    }

    // 3. Motorowery i czterokołowce lekkie (Kat. AM)
    if (
        [ "L1E", "L2E", "L6E" ].includes(kat) ||
        (pojemnoscSilnika > 0 && pojemnoscSilnika <= 50 && mocNetto <= 4)
    ) {
        return "AM";
    }

    // 4. Czterokołowce inne niż lekkie (Kat. B1)
    if (kat === "L7E") {
        return "B1";
    }

    // 5. Motocykle (Kategorie A1, A2, A)
    if (kat.startsWith("L") || (pojemnoscSilnika > 50 && !kat.startsWith("M") && !kat.startsWith("N"))) {
        if (pojemnoscSilnika <= 125 && mocNetto <= 11 && stosunekMocyDoMasy <= 0.1) {
            return "A1";
        }
        if (mocNetto <= 35 && stosunekMocyDoMasy <= 0.2) {
            return "A2";
        }
        return "A";
    }

    // 6. Samochody osobowe i ciężarowe (M1, N1, N2, N3)
    if (dopuszczalnaMasaCalkowita <= 3500) {
        return "B";
    }
    if (dopuszczalnaMasaCalkowita <= 7500) {
        return "C1";
    }
    return "C";
}

const getVehicleType = async (data: PolishVehicleRegistrationCertificateNewFormatData | PolishVehicleRegistrationCertificateOldFormatData): Promise<Vehicle.Type> => {
    const makeModel = data.markaPojazdu.value + ' ' + data.modelPojazdu.value[0] + data.modelPojazdu.value.slice(1).toLowerCase();
    const fuelType = FUEL_MAP[data.rodzajPaliwa.value];
    const types = await findVehicleType({ makeModel, fuelType });
    if (types.length) return types[0];

    const seats = parseInt(data.liczbaMiejscSiedzacych.value);
    const taxClass = discernDriverLicense({
        dopuszczalnaMasaCalkowita: parseInt(data.maksymalnaMasaCalkowitaPojazduKg.value),
        kategoriaPojazdu: ('kategoriaPojazdu' in data) ? data.kategoriaPojazdu.value : 'M1',
        liczbaMiejsc: seats,
        masaWlasna: parseInt(data.masaWlasnaPojazduKg.value),
        mocNetto: parseInt(data.maksymalnaMocNettoSilnikaKW.value),
        pojemnoscSilnika: parseInt(data.pojemnoscSilnikaCm3.value)
    })

    const type: Omit<Vehicle.Type, 'id'> = {
        makeModel,
        name: makeModel,
        fuelType: fuelType,
        eco: ECO_FUEL_TYPES.includes(fuelType),
        maxPassengers: seats - 1,
        foodDelivery: false,
        taxClass,
        xl: seats >= 7,
        premium: false,
        image: '',
        notes: ''
    }
    const id = (Date.now() - 1780000000000).toString(36)
    await setVehicleType(id, type);
    return { id, ...type } as Vehicle.Type;
}

export async function POST({ request }: { request: Request }) {
    const { b64Input } = await request.json()

    if (!b64Input) {
        throw error(400, 'Missing code');
    }

    const decoder = new PolishVehicleRegistrationCertificateDecoder(b64Input)

    if (decoder.data) {
        const type = await getVehicleType(decoder.data);
        const vehicle: Partial<Vehicle.NewVehicleData> = {
            firstRegistrationDate: decoder.data.dataPierwszejRejestracjiPojazdu.value,
            modelMake: type.makeModel,
            registrationNumber: decoder.data.numerRejestracyjnyPojazdu.value.replaceAll(' ', ''),
            vin: decoder.data.numerIdentyfikacyjnyPojazdu.value,
            notes: 'Skan ' + decoder.data.seriaDr.value,
        }
        return json({ vehicle, type })
    } else {
        throw error(400, 'Invalid data');
    }
}