import type { DataFilesProcessor } from "upload-datafiles-comp";
import type { VehicleInsuranceResult } from "../index";

export const headerLength = 180;

export const headers = [ 'UNIQA Towarzystwo Ubezpieczeń S.A., ul. Chłodna 51, 00-867 Warszawa,' ];

const allDone = (result: VehicleInsuranceResult) => {
    const keys: (keyof VehicleInsuranceResult)[] = [ 'name', 'vehicle', 'expirationDate' ];
    for (const key of keys) {
        if (!result[key]?.length) return false;
    }
    return true;
}

export const process: DataFilesProcessor = async (lines: string[]) => {
    const result: VehicleInsuranceResult = {
        expirationDate: '',
        type: 'oc_insurance_policy',
        name: '',
        vehicle: ''
    };
    
    let current = 0;
    const maxLines = Math.min(lines.length, 250);
    do {
        ++current;
        const line = lines[current];
        if (typeof line === 'undefined') break;
        if (!line.length) {
            continue;
        }

        if (line === "Numer rejestracyjny pojazdu") {
            current += 2;
            result.vehicle = lines[current];
            if (allDone(result)) return result;
            continue;
        }

        if (line === "NUMER POLISY") {
            current += 2;
            const number = lines[current];
            result.name = 'Polisa ' + number;
            if (allDone(result)) return result;
            continue;
        }

        if (line === "OKRES OCHRONY") {
            current += 2;
            const datesRange = lines[current];
            const match = datesRange.match(/^[0-9.]{10} - ([0-9]{2})\.([0-9]{2})\.([0-9]{4})$/);
            if (match) {
                result.expirationDate = `${match[3]}-${match[2]}-${match[1]}`;
            }
            if (allDone(result)) return result;
            continue;
        }
    } while (current < maxLines)
    return result;
};

export default {
    headers,
    headerLength,
    process
} as any;