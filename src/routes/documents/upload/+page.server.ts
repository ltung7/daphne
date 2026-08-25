import type { Actions } from './$types';
import type { VehicleDocumentResult } from '$lib/datafiles/vehicle';
import { extname } from 'path';
import { uploadVehicleDocument } from '$lib/server/services/uploadVehicleDocument.service';

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
        const extension = extname(file.name).slice(1);

        const doc = await uploadVehicleDocument({
            buffer,
            extension,
            name: data.name,
            registrationNumber: data.vehicle,
            type: data.type,
        })

        return { success: true, doc }
    }
}