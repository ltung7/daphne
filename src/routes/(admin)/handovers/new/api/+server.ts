import { error, json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import generateHandoverDocument from "$lib/documents/handover.document";
import makeResponse from "$lib/utils/makePdfBufferResponse";
import { createVehicleHandover, setVehicleHandovers } from "$lib/server/db/firebase/vehicleHandovers.fdb";
import { getUser } from "$lib/server/db/firebase/users.fdb";
import { sendHandoverDocumentCreatedNotification } from "$lib/server/notifications";

export const POST: RequestHandler = async ({ request, locals }) => {
    const data = await request.json();
    const variables = data.handover as DocumentGenerator.HandoverDocument;
    let id: string | undefined = data.id;

    if (id) {
        await setVehicleHandovers(id, variables);
    } else {
        const newData: Omit<DocumentGenerator.HandoverDocumentRecord, 'id'> = { 
            ...variables,
            manualClose: false,
            timestamp: Date.now(),
            type: 'assign',
            closed: false
        };
        id = await createVehicleHandover(newData);
        if (id) {
            try {
                const manager = variables.managerId ? await getUser(variables.managerId) : null;
                const recipient: App.BaseContact = manager ?? {
                    id: variables.managerId || locals._user?.id || 'system',
                    name: variables.managerName || locals._user?.name || 'Manager',
                    email: variables.managerEmail || locals._user?.email || '',
                    preferredLanguage: 'pl'
                };

                await sendHandoverDocumentCreatedNotification(recipient, {
                    registrationNumber: variables.registrationNumber,
                    documentType: 'assign',
                    userId: locals._user?.id ?? 'system',
                    userName: locals._user?.name ?? 'System',
                    handoverId: id
                }, 'admin_manual');
            } catch (err) {
                console.error('Failed to send handover created notification:', err);
            }
        }
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