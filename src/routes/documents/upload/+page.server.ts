import type { Actions } from './$types';
import type { VehicleDocumentResult } from '$lib/datafiles/vehicle';
import { uploadContents } from '$lib/server/services/storage.service';
import { setVehicleDocuments } from '$lib/server/db/firebase/vehicleDocuments.fdb';
import { createHash } from 'crypto';
import { extname } from 'path';

export const actions: Actions = {
    default: async ({ request }) => {
        const form = await request.formData();
        const file = form.get('file') as File | null;
        const data: VehicleDocumentResult = JSON.parse(form.get('data') as string);

        if (!file || file.size === 0) {
            return { success: false, message: "No file uploaded or file is empty." };
        }

        const arr = await file.arrayBuffer();
        const buffer = Buffer.from(arr);
        const hash = createHash('md5').update(buffer).digest('hex');
        const extension = extname(file.name);
        const filename = `v/${data.vehicle}/${hash}${extension}`;
        const url = await uploadContents(new Uint8Array(arr), filename);

        const doc: Partial<Vehicle.VehicleDocument> = {
            timestamp: Date.now(),
            name: data.name,
            registrationNumber: data.vehicle,
            type: data.type,
            uploader: '',
            url
        }
        await setVehicleDocuments(hash, doc)
        doc.id = hash;

        return { success: true, doc }
    }
}