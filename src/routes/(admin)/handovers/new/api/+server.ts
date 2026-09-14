import { error, json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import generateHandoverDocument from "$lib/documents/handover.document";
import makeResponse from "$lib/utils/makePdfBufferResponse";
import { createVehicleHandover, setVehicleHandovers } from "$lib/server/db/firebase/vehicleHandovers.fdb";
import { assignVehicleAndCloseHandover } from "$lib/server/services/vehicleStatus.service";

export const POST: RequestHandler = async ({ request }) => {
    const data = await request.json();
    const variables = data.handover as DocumentGenerator.HandoverDocument;
    let id: string | undefined = data.id;

    if (id) {
        await setVehicleHandovers(id, variables);
    } else {
        const newData: Omit<DocumentGenerator.HandoverDocumentRecord, 'id'> = { 
            ...variables,
            manualClose: data.action === 'close',
            timestamp: Date.now(),
            type: 'assign',
            closed: false
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
        case 'close': {
            await assignVehicleAndCloseHandover({
                driverId: variables.driverId,
                driverName: variables.driverName,
                handoverId: id,
                registrationNumber: variables.registrationNumber
            })
            break;
        }
    }

    return json({ success: true, action: data.action, id })
};