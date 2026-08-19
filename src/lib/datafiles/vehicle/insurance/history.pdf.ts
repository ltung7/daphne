import type { DataFilesProcessor, DataFileType } from "upload-datafiles-comp";
import type { VehicleDocumentDescriptor, VehicleHistoryResult } from "../index";

export const headerLength = 3;

export const headers = [ 'Raport z usługi Historia pojazdu', "Status rejestracji:" ];

export const process: DataFilesProcessor<any, DataFileType.PDF> = async (lines: string[]) => {
    const result: VehicleHistoryResult = {
        insuranceExpiration: '',
        technicalExpiration: '',
        firstRegistrationDate: '',
        type: 'vehicle_history',
        name: '',
        vehicle: ''
    };
    
    let current = 0;
    const maxLines = Math.min(lines.length, 2000);
    do {
        ++current;
        const line = lines[current];
        if (typeof line === 'undefined') break;
        if (!line.length) {
            continue;
        }

        if (line.startsWith('Okresowe badanie techniczne')) {
            const matched = line.match(/ważne do ([0-9]{2})\.([0-9]{2})\.([0-9]{4})/);
            if (matched) {
                const date = [ matched[3], matched[2], matched[1] ].join('-');
                result.technicalExpiration = date;
            }
            continue;
        }

        if (line === "Pierwsza rejestracja w Polsce") {
            const datePl = lines[current - 2];
            const matched = datePl.match(/^([0-9]{2})\.([0-9]{2})\.([0-9]{4})$/);
            if (matched) {
                const date = [ matched[3], matched[2], matched[1] ].join('-');
                result.firstRegistrationDate = date;
            }
        }

        if (line === "Numer rejestracyjny") {
            current += 2;
            result.vehicle = lines[current];
            continue;
        }

        if (line === "Data wygenerowania:") {
            current += 2;
            result.name = 'Historia pojazdu ' + lines[current];
            continue;
        }

        if (line === "Data ważności polisy") {
            current += 2;
            const datePl = lines[current];
            const matched = datePl.match(/^([0-9]{2})\.([0-9]{2})\.([0-9]{4})$/);
            if (matched) {
                const date = [ matched[3], matched[2], matched[1] ].join('-');
                result.insuranceExpiration = date;
            }
            continue;
        }
    } while (current < maxLines)
    return result;
};

export default {
    headers,
    headerLength,
    process
} as VehicleDocumentDescriptor;