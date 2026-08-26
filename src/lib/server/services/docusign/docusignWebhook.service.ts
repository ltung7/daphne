import type { DocusignWebhookEvent, EventCustomFields } from "./docusign";
import { isDev } from "$lib/utils/isDev";
import { thrower } from "$lib/utils/logger";
import { insertRandomLog } from "$lib/server/db/tables/randomLogs.db";
import { uploadVehicleDocument } from "../uploadDocument.service";
import { setVehicleHandovers } from "../../db/firebase/vehicleHandovers.fdb";
import { assignVehicleAndCloseHandover } from "../vehicleStatus.service";
import { getDocusignApi } from "./docusign.token";

const processEnvelopeCompleted = async (payload: DocusignWebhookEvent<[EventCustomFields]>) => {
    console.log("EVENT ENVELOPE COMPLETED")
        if (!payload.data.envelopeSummary.customFields?.textCustomFields?.length) {
        throw new Error("No custom fields");
    }
    const customFields = payload.data.envelopeSummary.customFields.textCustomFields.reduce((obj, item) => {
        obj[item.name] = item.value;
        return obj;
    }, {} as Record<string, string>)
    let uploadedDocumentUrl: string | undefined;
    console.log('CUSTOM FIELDS:' + JSON.stringify(customFields))

    if (customFields.vehicle) {
        console.log("SAVEHEHICLE COX")
        const { envelopesApi, accountId } = await getDocusignApi();
        
        const buffer: Buffer = await envelopesApi.getDocument(accountId, payload.data.envelopeId, 'combined', {}) as unknown as Buffer;
        const doc = await uploadVehicleDocument({
            buffer,
            extension: 'pdf',
            name: payload.data.envelopeSummary.emailSubject,
            registrationNumber: customFields.vehicle,
            type: 'vehicle_handover_document',
        })
        uploadedDocumentUrl = doc.url;
    }
    
    if (customFields.handoverId) {
        console.log("SET HANDOVER")
        await setVehicleHandovers(customFields.handoverId, { docusignSigned: Date.now() });
    }

    if (customFields.handoverId && customFields.vehicle && customFields.driver) {
        console.log("ASSIGN ALL")
        const afterVehicle = payload.data.envelopeSummary.emailSubject.indexOf(customFields.vehicle) + customFields.vehicle.length + 1;
        const driverName = payload.data.envelopeSummary.emailSubject.substring(afterVehicle).trim();
        await assignVehicleAndCloseHandover({
            driverId: customFields.driver,
            driverName,
            handoverId: customFields.handoverId,
            registrationNumber: customFields.vehicle,
            uploadedDocumentUrl
        })
    }
}

export const processDocusignWebhook = async (payload: DocusignWebhookEvent<[EventCustomFields]>) => {
    if (!isDev) {
        await insertRandomLog('DocusignWebhook ' + payload.event, payload);
    }

    try {
        if (payload.event === 'envelope-completed') {
            await processEnvelopeCompleted(payload);
        }
    } catch (err) {
        if (isDev) console.error(err);
        else thrower.slack(err, 'DocusignWebhook');
    }
} 