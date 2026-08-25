import type { Signer, EnvelopeDefinition, EnvelopeRecipientTabs } from "docusign-esign";
import { getDocusignApi } from "./docusign.token";
import { thrower } from "$lib/utils/logger";

const signTabPage = (pageNumber: number = 1, leftSide = false): EnvelopeRecipientTabs => {
    return {
        signHereTabs: [ {
            documentId: '1',
            pageNumber: pageNumber.toString(),
            yPosition: '760',
            xPosition: leftSide ? '120' : '400'
        } ]
    }
}

interface SignerData {
    email: string;
    name: string;
}

interface SendEnvelopeParameters {
    buffer: Buffer;
    name: string;
    page: number;
    rightSigner: SignerData;
    metadata?: Record<string, string>;
    leftSigner?: SignerData;
}

// --- Build envelope with two email signers ---
export async function sendEnvelope({ buffer, name, rightSigner, leftSigner, metadata, page = 1 }: SendEnvelopeParameters) {

    const signers: Signer[] = [];

    if (leftSigner) signers.push({
        email: leftSigner.email,
        name: leftSigner.name,
        recipientId: '1',
        routingOrder: '1',
        deliveryMethod: 'email',
        tabs: signTabPage(page, true)
    })

    signers.push({
        email: rightSigner.email,
        name: rightSigner.name,
        recipientId: leftSigner ? '2' : '1',
        routingOrder: leftSigner ? '2' : '1',
        deliveryMethod: 'email',
        tabs: signTabPage(page, false)
    })

    const envelopeDefinition: EnvelopeDefinition = {
        emailSubject: name,
        recipients: { signers },
        documents: [ {
            documentBase64: buffer.toString("base64"),
            name,
            fileExtension: "pdf",
            documentId: "1",
        } ],
        status: 'sent',
    }

    if (metadata) {
        const entries = Object.entries(metadata);
        if (entries.length) {
            envelopeDefinition.customFields = {
                textCustomFields: entries.map(([ name, value ]) => ({
                    name, value, show: 'false'
                }))
            }
        }
    }

    const { envelopesApi, accountId } = await getDocusignApi();
    try {
        const results = await envelopesApi.createEnvelope(accountId, {
            envelopeDefinition,
        });

        return results;
    } catch (err) {
        console.error(err)
    }
}

export async function resendEnvelope(envelopeId: string) {
    const { envelopesApi, accountId } = await getDocusignApi();

    const options = {
        resendEnvelope: 'true'
    };

    try {
        const updateSummary = await envelopesApi.updateRecipients(accountId, envelopeId, options);
        return updateSummary;
    } catch (err) {
        thrower.axios(err, 'DocuSignResend')
    }
}