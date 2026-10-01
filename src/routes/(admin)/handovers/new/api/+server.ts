import { error, json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import generateHandoverDocument from "$lib/documents/handover.document";
import makeResponse from "$lib/utils/makePdfBufferResponse";
import { createVehicleHandover, setVehicleHandovers } from "$lib/server/db/firebase/vehicleHandovers.fdb";

export const POST: RequestHandler = async ({ request }) => {
    const data = await request.json();
    const variables = data.handover as DocumentGenerator.HandoverDocument;
    let id: string | undefined = data.id;

    if (id) {
        await setVehicleHandovers(id, variables);
    } else {
        const newData: Omit<DocumentGenerator.HandoverDocumentRecord, 'id'> = { 
            ...variables,
            timestamp: Date.now(),
            type: 'assign',
            closed: false,
            manualClose: false
        };
        id = await createVehicleHandover(newData);
    }

    if (!id) {
        throw error(500, 'Failed to save handover');
    }

    switch (data.action) {
        case 'pdf': {
            const buffer = await generateHandoverDocument(variables, id);
            const name = `Protoków wydania pojazdu`;
            await setVehicleHandovers(id, { printed: Date.now() })
            return makeResponse(buffer, name);
        }
        case 'docusign': {
            await generateHandoverDocument(variables, id, true);
            break;
        }
    }

    return json({ success: true, action: data.action, id })
};