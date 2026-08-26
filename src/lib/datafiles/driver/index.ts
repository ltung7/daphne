import type { DataFilesDescriptor, DataFilesProcessor, DataFilesType } from 'upload-datafiles-comp';

// type DriverResult<
//     TType extends string,
//     TFields extends keyof Driver.Driver = never
// > = Pick<Driver.Driver, TFields> & {
//     type: TType;
//     vehicle: string;
//     name: string;
// };

interface UnknownDriverResult {
    type: Driver.DocumentType;
    name: string;
    driverId: string;
}

export type DriverDocumentResult = UnknownDriverResult;

export type DriverDocumentProcessFunction = DataFilesProcessor<DriverDocumentResult>;

export interface DriverDocumentDescriptor extends DataFilesDescriptor {
    process: DriverDocumentProcessFunction;
}

export class DatafileProcessingError extends Error { };

type CourierDataFiles = DataFilesType<DriverDocumentDescriptor, 'datasheets' | 'pdf' | 'image'>;

const datafiles: CourierDataFiles = {
    datasheets: {

    },
    pdf: {
        
    },
    image: {
        
    }
} as CourierDataFiles;

export default datafiles;