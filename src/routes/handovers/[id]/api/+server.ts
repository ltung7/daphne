import { error, json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import generateHandoverDocument from "$lib/documents/handover.document";
import makeResponse from "$lib/utils/makePdfBufferResponse";
import { deleteVehicleHandover, getVehicleHandovers, setVehicleHandovers } from "$lib/server/db/firebase/vehicleHandovers.fdb";
import { assignVehicleAndCloseHandover } from "$lib/server/services/vehicleStatus.service";
import { resendEnvelope } from "$lib/server/services/docusign/docusign.service";

export const POST: RequestHandler = async ({ params, request }) => {
    const data = await request.json();
    const handover = await getVehicleHandovers(params.id);
    if (!handover) throw error(404, 'Invalid handover document')
    
    switch (data.action) {
        case 'pdf': {
            const buffer = await generateHandoverDocument(handover, handover.id);
            const name = `Protoków wydania pojazdu`;
            await setVehicleHandovers(handover.id, { printed: Date.now() })
            return makeResponse(buffer, name);
        }
        case 'docusign': {
            if (handover.docusignId) {
                await resendEnvelope(handover.docusignId);
            } else {
                await generateHandoverDocument(handover, handover.id, true);
            }
            break;
        }
        case 'close': {
            await assignVehicleAndCloseHandover({
                driverId: handover.driverId,
                driverName: handover.driverName,
                handoverId: handover.id,
                registrationNumber: handover.registrationNumber
            })
            break;
        }
    }

    return json({ success: true })
};

export const DELETE: RequestHandler = async ({ params }) => {
    const handover = await getVehicleHandovers(params.id);
    if (!handover) throw error(404, 'Dokument nie został odnaleziony');
    if (handover.closed) throw error(400, 'Dokument został już zamknięty - nie można go usunąć');
    if (handover.docusignId) throw error(400, 'Dokument został wysłany do DocuSign - nie można go usunąć');
    await deleteVehicleHandover(params.id);
    return json({  success: true })
}