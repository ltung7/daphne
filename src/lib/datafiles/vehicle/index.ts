import type { DataFilesDescriptor, DataFilesProcessor, DataFilesType } from 'upload-datafiles-comp';
import uniqua from './insurance/uniqua.pdf';

interface VehicleResult {
    type: Vehicle.DocumentType;
    vehicle: string;
    name: string;
}

export interface VehicleInsuranceResult extends VehicleResult {
    type: 'oc_insurance_policy';
    expirationDate: string;
} 

export type VehicleDocumentResult = VehicleInsuranceResult;

export type VehicleDocumentProcessFunction = DataFilesProcessor<VehicleDocumentResult>;

export interface VehicleDocumentDescriptor extends DataFilesDescriptor {
    process: VehicleDocumentProcessFunction;
}

export class DatafileProcessingError extends Error {};

type CourierDataFiles = DataFilesType<VehicleDocumentDescriptor, 'datasheets'|'pdf'>;

const datafiles: CourierDataFiles = {
    datasheets: {

    },
    pdf: {
        uniqua
    }
} as CourierDataFiles;

export default datafiles;