import { uploadContents } from '$lib/server/services/storage.service';
import { setVehicleDocuments } from '$lib/server/db/firebase/vehicleDocuments.fdb';
import { createHash } from 'crypto';

interface UploadVehicleDocumentParams { 
    buffer: Buffer;
    registrationNumber: string;
    name: string;
    extension: string;
    type: Vehicle.DocumentType;
    uploader?: string;
}

export const uploadVehicleDocument = async ({ buffer, extension, name, registrationNumber, type, uploader = '' }: UploadVehicleDocumentParams): Promise<Vehicle.VehicleDocument> => {
    const hash = createHash('md5').update(buffer).digest('hex');
    const filename = `v/${registrationNumber}/${hash}.${extension}`;
    const url = await uploadContents(buffer, filename);

    const doc: Partial<Vehicle.VehicleDocument> = {
        timestamp: Date.now(),
        name,
        registrationNumber,
        type,
        uploader,
        url
    }
    await setVehicleDocuments(hash, doc)
    doc.id = hash;

    return doc as Vehicle.VehicleDocument;
} 