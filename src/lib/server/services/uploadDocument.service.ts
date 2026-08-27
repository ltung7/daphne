import { BUCKETS, uploadContents } from '$lib/server/services/storage.service';
import { setVehicleDocuments } from '$lib/server/db/firebase/vehicleDocuments.fdb';
import { createHash } from 'crypto';
import { setDriverDocuments } from '../db/firebase/driverDocuments.fdb';
import { setVehicleHandoverImage } from '../db/firebase/vehicleHandoverImage.fdb';

interface UploadDocumentParams {
    buffer: Buffer;
    name: string;
    extension: string;
    uploader?: string;
}

interface UploadVehicleDocumentParams extends UploadDocumentParams { 
    registrationNumber: string;
    type: Vehicle.DocumentType;
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

interface UploadDriverDocumentParams extends UploadDocumentParams { 
    driverId: string;
    type: Driver.DocumentType;
}

export const uploadDriverDocument = async ({ buffer, extension, name, driverId, type, uploader = '' }: UploadDriverDocumentParams): Promise<Driver.DriverDocument> => {
    const hash = createHash('md5').update(buffer).digest('hex');
    const filename = `d/${driverId}/${hash}.${extension}`;
    const url = await uploadContents(buffer, filename);

    const doc: Partial<Driver.DriverDocument> = {
        timestamp: Date.now(),
        name,
        driverId,
        type,
        uploader,
        url
    }
    await setDriverDocuments(hash, doc)
    doc.id = hash;

    return doc as Driver.DriverDocument;
} 

interface UploadHandoverImageParams extends UploadDocumentParams { 
    handoverId: string;
    type?: DocumentGenerator.HandoverImageType;
}

export const uploadHandoverImage = async ({ buffer, extension, name, handoverId, type, uploader = '' }: UploadHandoverImageParams): Promise<DocumentGenerator.HandoverImage> => {
    const hash = createHash('md5').update(buffer).digest('hex');
    const filename = `h/${handoverId}/${hash}.${extension}`;
    const url = await uploadContents(buffer, filename);
    if (!type) type = "image";

    const doc: Partial<DocumentGenerator.HandoverImage> = {
        timestamp: Date.now(),
        name,
        handoverId,
        type,
        uploader,
        url
    }
    await setVehicleHandoverImage(hash, doc)
    doc.id = hash;

    return doc as DocumentGenerator.HandoverImage;
} 

export const uploadTempImage = async (buffer: Buffer, extension: string) => {
    const hash = createHash('md5').update(buffer).digest('hex');
    const filename = `${hash}.${extension}`;
    const url = await uploadContents(buffer, filename, BUCKETS.TEMP);
    return url;
}