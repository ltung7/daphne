import { identificationDocumentNames } from "$lib/assets/constants";
import { sendEnvelope } from "$lib/server/services/docusign/docusign.service";
import { getTranslations } from "./handover.lang";
import { PdfHelpers, preparePdf } from "./pdf";
import translations from "./handover.translations";
import { setVehicleHandovers, getVehicleHandovers } from "$lib/server/db/firebase/vehicleHandovers.fdb";
import { testDocument } from "$lib/utils/testDocument";

const PAPER = {
    margins: { top: 20, left: 20, right: 20, bottom: 20 },
    size: [ 595, 840 ],
}

const generateHandoverDocument = async (handoverDocument: DocumentGenerator.HandoverDocument, handoverId?: string, send: boolean = false) => {
    const translation = await getTranslations(handoverDocument.locale);
    let images: Array<Buffer> = [];
    if (handoverDocument.images?.length) {
        images = await Promise.all(handoverDocument.images.map(item => PdfHelpers.fetchImageBuffer(item)))
    }
    const buffer = await preparePdf(PAPER, async (pdf) => {
        const helpers = new PdfHelpers(pdf, pdf.y);

        helpers.title(translation.title);
        helpers.subtitle(translation.handoverSubtitle);
        helpers.line();

        helpers.sectionHeader(translation.section1Header);
        helpers.twoColLabeledLines(translation.place, translation.date, { valueA: handoverDocument.place, valueB: handoverDocument.date });
        helpers.labeledLine(translation.manager + ':', { value: handoverDocument.owner + ', ' + handoverDocument.managerName });
        const idType = identificationDocumentNames[handoverDocument.identificationDocumentType as Driver.IdentificationDocumentType];
        helpers.labeledLine(translation.driver + ":", { value: handoverDocument.driverName + ', ' + idType + ' ' + handoverDocument.identificationDocumentNumber });
        helpers.padY(6);

        helpers.sectionHeader(translation.section2Header);
        helpers.labeledLine(translation.model + ":", { value: handoverDocument.model });
        helpers.twoColLabeledLines(translation.plate + ":", 'VIN:', { valueB: handoverDocument.vin, valueA: handoverDocument.registrationNumber });
        const remainingType = handoverDocument.isElectric ? translation.battery : translation.fuel;
        helpers.twoColLabeledLines(translation.mileage + ":", remainingType + ":", { valueA: handoverDocument.milage, valueB: handoverDocument.remaining });
        helpers.padY(6);

        helpers.sectionHeader(translation.section3Header);
        helpers.equipmentGrid(
            [
                [ translation.equipmentKey, handoverDocument.key ],
                [ translation.equipmentSpareKey, handoverDocument.spareKey ],
                [ translation.equipmentRegistration, handoverDocument.registration ],
                [ translation.equipmentRoofSign, handoverDocument.roofSign ],
                [ translation.equipmentFuelCard, handoverDocument.fuelCard ],
                [ translation.equipmentCarWashCard, handoverDocument.carWashCard ],
                [ translation.equipmentTire, handoverDocument.tire ],

                [ translation.equipmentExtinguisher, handoverDocument.exinguisher ],
                [ translation.equipmentTriangle, handoverDocument.triangle ],
                [ translation.equipmentVest, handoverDocument.vest ],
                [ translation.equipmentFirstAidKit, handoverDocument.firstAidKit ],
                [ translation.equipmentMats, handoverDocument.mats ],
                [ translation.equipmentPhoneHolder, handoverDocument.phoneHolder ],
                [ translation.equipmentPhoneCharger, handoverDocument.phoneCharger ]
            ]
        );
        helpers.padY(6);

        helpers.sectionHeader(translation.section4Header);
        helpers.paragraph(translation.section4Paragraph + ":");
        helpers.padY(6);
        let visual = handoverDocument.visual;
        if (handoverDocument.locale !== 'pl' && handoverDocument.translatedVisual) {
            visual += " / " + handoverDocument.translatedVisual;
        }
        helpers.notesBox(4, visual);
        if (handoverDocument.images?.length) {
            helpers.paragraph(translation.imagesAttachment)
        }
        helpers.padY(6);

        helpers.sectionHeader(translation.section5Header);
        if (!handoverDocument.locale || handoverDocument.locale === 'pl') {
            helpers.numberedClauses(translations.pl.handoverClauses)
        } else {
            const clauseLocale = translation._foreign!;
            helpers.twoColNumberedClauses(translations.pl.handoverClauses, clauseLocale.handoverClauses)
        }

        helpers.setY(770);
        helpers.signatureLine(translation.signatureDriver, translation.signatureManager);

        if (images.length) {
            const subtitle = translation.imagesAttachmentText
                .replaceAll('{date}', handoverDocument.date)
                .replaceAll('{place}', handoverDocument.place)
                .replaceAll('{model}', handoverDocument.model)
                .replaceAll('{registrationNumber}', handoverDocument.registrationNumber)
                .replaceAll('{vin}', handoverDocument.vin)

            for (let i = 0; i < images.length; i++) {
                if (i % 2 === 0) helpers.addAttachmentPage(translation.imagesAttachmentHeader, subtitle)
                helpers.padY(10);
                helpers.drawImage(i + 1, images[i], translation.imageNumer);
            }
        }
    })

    if (send && handoverId) {
        const envelope = await sendEnvelope({
            buffer,
            name: `Protoków wydania pojazdu ${handoverDocument.registrationNumber} ${handoverDocument.driverName}`,
            page: 1,
            rightSigner: {
                email: handoverDocument.driverEmail,
                name: handoverDocument.driverName
            },
            leftSigner: {
                email: handoverDocument.managerEmail,
                name: handoverDocument.managerName
            },
            metadata: {
                driver: handoverDocument.driverId,
                vehicle: handoverDocument.registrationNumber,
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

export const testHandoverDocument = async (handoverDocument: DocumentGenerator.HandoverDocument | string) => {
    const { filePath } = await testDocument(handoverDocument, {
        getFunction: getVehicleHandovers<DocumentGenerator.HandoverDocumentRecord>,
        generateFunction: (record) => generateHandoverDocument(record, undefined, false),
        description: "Handover",
        key: "registrationNumber",
    });
    return filePath;
}

export default generateHandoverDocument;