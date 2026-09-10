import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { addVehicleInspection } from '$lib/server/db/firebase/vehicleInspections.fdb';

export const POST: RequestHandler = async ({ request }) => {
    const data = await request.json() as DocumentGenerator.InspectionDocument;
    const inspection: Omit<DocumentGenerator.InspectionDocumentRecord, 'id'> = {
        ...data,
        uploader: '',
        timestamp: Date.now()
    }
    const id = await addVehicleInspection(inspection);
    if (!id) throw error(500, 'Unable to add inspection document')
    return json({ success: true, id })
};