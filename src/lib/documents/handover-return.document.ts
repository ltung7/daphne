import { identificationDocumentNames } from "$lib/assets/constants";
import { getTranslations } from "./handover.lang";
import { PdfHelpers, preparePdf } from "./pdf";
import translations from "./handover.translations";
import { testDocument } from "$lib/utils/testDocument";
import { getVehicleHandovers } from "$lib/server/db/firebase/vehicleHandovers.fdb";

const PAPER = {
    margins: { top: 20, left: 20, right: 20, bottom: 20 },
    size: [ 595, 840 ],
}

const generateHandoverReturnDocument = async (handoverDocument: DocumentGenerator.HandoverDocument, locale?: DocumentGenerator.Locale) => {
    const translation = await getTranslations(locale);
    return preparePdf(PAPER, (pdf) => {
        const helpers = new PdfHelpers(pdf, pdf.y);

        helpers.title(translation.title);
        helpers.subtitle(translation.returnSubtitle);
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
        helpers.notesBox(4, handoverDocument.visual);
        helpers.padY(6);

        helpers.sectionHeader(translation.section5Header);
        if (!locale || locale === 'pl') {
            helpers.numberedClauses(translations.pl.returnClauses)
        } else {
            const clauseLocale = translation._foreign!;
            helpers.twoColNumberedClauses(translations.pl.returnClauses, clauseLocale.returnClauses)
        }

        helpers.setY(770);
        helpers.signatureLine(translation.signatureDriver, translation.signatureManager);
    })
}

export const testHandoverReturnDocument = async (handoverDocument: DocumentGenerator.HandoverDocument | string) => {
    const { filePath } = await testDocument(handoverDocument, {
        getFunction: getVehicleHandovers<DocumentGenerator.HandoverDocumentRecord>,
        generateFunction: (record) => generateHandoverReturnDocument(record),
        description: "Handover Return",
        key: "registrationNumber",
    });
    return filePath;
}

export default generateHandoverReturnDocument;