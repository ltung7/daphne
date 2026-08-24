import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import generateHandoverDocument from "$lib/documents/handover.document";
import makeResponse from "$lib/utils/makePdfBufferResponse";

export const POST: RequestHandler = async ({ request }) => {
    const data = await request.json();
    const variables = data.handover as DocumentGenerator.HandoverDocument;
    variables.send = false;

    switch (data.action) {
        case 'pdf': {
            const buffer = await generateHandoverDocument(data.handover);
            const name = `Protoków wydania pojazdu ${variables.registrationNumber} ${variables.driverName}`;
            return makeResponse(buffer, name);
        }
        case 'docusign': {

            break;
        }
        case 'close': {

            break;
        }
    }

    return json({ success: true, action: data.action })
};