import type { Actions } from './$types';
import type { VehicleDocumentResult } from '$lib/datafiles/vehicle';
import type { DriverDocumentResult } from '$lib/datafiles/driver';
import { extname } from 'path';
import { uploadVehicleDocument, uploadDriverDocument } from '$lib/server/services/uploadDocument.service';

export const actions: Actions = {
    default: async ({ request }) => {
        const form = await request.formData();
        const file = form.get('file') as File | null;
        const data: VehicleDocumentResult | DriverDocumentResult = JSON.parse(form.get('data') as string);

        if (!file || file.size === 0) {
            return { success: false, message: "No file uploaded or file is empty." };
        }

        const arr = await file.arrayBuffer();
        const buffer = Buffer.from(arr);
        const extension = extname(file.name).slice(1);

        if ('vehicle' in data) {
            const doc = await uploadVehicleDocument({
                buffer,
                extension,
                name: data.name,
                registrationNumber: data.vehicle,
                type: data.type,
            })
            return { success: true, doc }
        }

        if ('driverId' in data) {
            const doc = await uploadDriverDocument({
                buffer,
                extension,
                name: data.name,
                driverId: data.driverId,
                type: data.type,
            })
            return { success: true, doc }
        }

    }
}