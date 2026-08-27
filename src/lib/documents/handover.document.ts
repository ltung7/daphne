import { identificationDocumentNames } from "$lib/assets/constants";
import { sendEnvelope } from "$lib/server/services/docusign/docusign.service";
import { getTranslations } from "./handover.lang";
import { PdfHelpers, preparePdf } from "./pdf";
import { translations } from "./handover.translations";
import { setVehicleHandovers } from "$lib/server/db/firebase/vehicleHandovers.fdb";

const PAPER = {
    margins: { top: 20, left: 20, right: 20, bottom: 20 },
    size: [ 595, 840 ],
}

async function fetchImageBuffer(url: string): Promise<Buffer> {
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Failed to fetch image: ${url} (${response.status})`);
    }
    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
}

const generateHandoverDocument = async (variables: DocumentGenerator.HandoverDocument, handoverId: string, send: boolean = false) => {
    const translation = await getTranslations(variables.locale);
    let images: Array<Buffer> = [];
    if (variables.images.length) {
        images = await Promise.all(variables.images.map(item => fetchImageBuffer(item)))
    }
    const buffer = await preparePdf(PAPER, async (pdf) => {
        const helpers = new PdfHelpers(pdf, pdf.y);

        helpers.title(translation.title);
        helpers.subtitle(translation.handoverSubtitle);
        helpers.line();

        helpers.sectionHeader(translation.section1Header);
        helpers.twoColLabeledLines(translation.place, translation.date, { valueA: variables.place, valueB: variables.date });
        helpers.labeledLine(translation.manager + ':', { value: variables.owner + ', ' + variables.managerName });
        const idType = identificationDocumentNames[variables.identificationDocumentType as Driver.IdentificationDocumentType];
        helpers.labeledLine(translation.driver + ":", { value: variables.driverName + ', ' + idType + ' ' + variables.identificationDocumentNumber });
        helpers.padY(6);

        helpers.sectionHeader(translation.section2Header);
        helpers.labeledLine(translation.model + ":", { value: variables.model });
        helpers.twoColLabeledLines(translation.plate + ":", 'VIN:', { valueB: variables.vin, valueA: variables.registrationNumber });
        const remainingType = variables.isElectric ? translation.battery : translation.fuel;
        helpers.twoColLabeledLines(translation.mileage + ":", remainingType + ":", { valueA: variables.milage, valueB: variables.remaining });
        helpers.padY(6);

        helpers.sectionHeader(translation.section3Header);
        helpers.equipmentGrid(
            [
                [ translation.equipmentKey, variables.key ],
                [ translation.equipmentSpareKey, variables.spareKey ],
                [ translation.equipmentRegistration, variables.registration ],
                [ translation.equipmentRoofSign, variables.roofSign ],
                [ translation.equipmentFuelCard, variables.fuelCard ],
                [ translation.equipmentCarWashCard, variables.carWashCard ],
                [ translation.equipmentTire, variables.tire ],

                [ translation.equipmentExtinguisher, variables.exinguisher ],
                [ translation.equipmentTriangle, variables.triangle ],
                [ translation.equipmentVest, variables.vest ],
                [ translation.equipmentFirstAidKit, variables.firstAidKit ],
                [ translation.equipmentMats, variables.mats ],
                [ translation.equipmentPhoneHolder, variables.phoneHolder ],
                [ translation.equipmentPhoneCharger, variables.phoneCharger ]
            ]
        );
        helpers.padY(6);

        helpers.sectionHeader(translation.section4Header);
        helpers.paragraph(translation.section4Paragraph + ":");
        helpers.padY(6);
        let visual = variables.visual;
        if (variables.locale !== 'pl' && variables.translatedVisual) {
            visual += " / " + variables.translatedVisual;
        }
        helpers.notesBox(4, visual);
        if (variables.images.length) {
            helpers.paragraph(translation.imagesAttachment)
        }
        helpers.padY(6);

        helpers.sectionHeader(translation.section5Header);
        if (!variables.locale || variables.locale === 'pl') {
            helpers.numberedClauses(translations.pl.handoverClauses)
        } else {
            const clauseLocale = translation._foreign!;
            helpers.twoColNumberedClauses(translations.pl.handoverClauses, clauseLocale.handoverClauses)
        }

        helpers.setY(770);
        helpers.signatureLine(translation.signatureDriver, translation.signatureManager);

        if (images.length) {
            const subtitle = translation.imagesAttachmentText
                .replaceAll('{date}', variables.date)
                .replaceAll('{place}', variables.place)
                .replaceAll('{model}', variables.model)
                .replaceAll('{registrationNumber}', variables.registrationNumber)
                .replaceAll('{vin}', variables.vin)

            for (let i = 0; i < images.length; i++) {
                if (i % 2 === 0) helpers.addAttachmentPage(translation.imagesAttachmentHeader, subtitle)
                helpers.padY(10);
                helpers.drawImage(i + 1, images[i], translation.imageNumer);
            }
        }
    })

    if (send) {
        const envelope = await sendEnvelope({
            buffer,
            name: `Protoków wydania pojazdu ${variables.registrationNumber} ${variables.driverName}`,
            page: 1,
            rightSigner: {
                email: variables.driverEmail,
                name: variables.driverName
            },
            leftSigner: {
                email: variables.managerEmail,
                name: variables.managerName
            },
            metadata: {
                driver: variables.driverId,
                vehicle: variables.registrationNumber,
                handoverId
            }
        })
        if (envelope?.envelopeId && handoverId.length) {
            await setVehicleHandovers(handoverId, {
                docusignId: envelope.envelopeId,
                docusignSent: Date.now()
            })
        }
    }

    return buffer;
}

export default generateHandoverDocument;