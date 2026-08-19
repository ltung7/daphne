import type { DataFilesDescriptor, DataFilesProcessor, DataFilesType } from 'upload-datafiles-comp';
import uniquaPdf from './insurance/uniqua.pdf';
import historyPdf from './insurance/history.pdf';

type VehicleResult<
    TType extends string,
    TFields extends keyof Vehicle.Vehicle = never
> = Pick<Vehicle.Vehicle, TFields> & {
    type: TType;
    vehicle: string;
    name: string;
};

interface UnknownVehicleResult {
    type: Vehicle.DocumentType;
    name: string;
    vehicle: string;
}

export type VehicleInsuranceResult = VehicleResult<
    'oc_insurance_policy',
    'insuranceExpiration'
>;

export type VehicleHistoryResult = VehicleResult<
    'vehicle_history',
    'insuranceExpiration' | 'technicalExpiration' | 'firstRegistrationDate'
>;

export type VehicleDocumentResult = UnknownVehicleResult | VehicleInsuranceResult | VehicleHistoryResult;

export type VehicleDocumentProcessFunction = DataFilesProcessor<VehicleDocumentResult>;

export interface VehicleDocumentDescriptor extends DataFilesDescriptor {
    process: VehicleDocumentProcessFunction;
}

export class DatafileProcessingError extends Error { };

type CourierDataFiles = DataFilesType<VehicleDocumentDescriptor, 'datasheets' | 'pdf' | 'image'>;

const datafiles: CourierDataFiles = {
    datasheets: {

    },
    pdf: {
        historyPdf,
        uniquaPdf
    },
    image: {
        
    }
} as CourierDataFiles;

export default datafiles;