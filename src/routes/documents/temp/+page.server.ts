import type { Actions } from './$types';
import { extname } from 'path';
import { uploadTempImage } from '$lib/server/services/uploadDocument.service';

export const actions: Actions = {
    default: async ({ request }) => {
        const form = await request.formData();
        const file = form.get('file') as File | null;

        if (!file || file.size === 0) {
            return { success: false, message: "No file uploaded or file is empty." };
        }

        const arr = await file.arrayBuffer();
        const buffer = Buffer.from(arr);
        const extension = extname(file.name).slice(1);

        const url = await uploadTempImage(buffer, extension);
        return { success: true, url }
    }
}