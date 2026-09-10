import { getVehicleHandovers } from "$lib/server/db/firebase/vehicleHandovers.fdb";
import { testDocument } from "$lib/utils/testDocument";
import translations from "./handover.translations";
import { PdfHelpers, preparePdf } from "./pdf";

const PAPER = {
    margins: { top: 20, left: 20, right: 20, bottom: 20 },
    size: [ 595, 840 ],
}

const generateHandoverUnilateralDocument = async (handoverDocument: DocumentGenerator.HandoverDocument) => {
    return preparePdf(PAPER, (pdf) => {
        const helpers = new PdfHelpers(pdf, pdf.y);
        const translation = translations.pl;

        helpers.title(translation.title);
        helpers.subtitle(translation.unilateralSubtitle);
        helpers.line();

        helpers.sectionHeader(translation.section1Header);
        helpers.twoColLabeledLines(translation.date, translation.reasonForRecovery, { valueA: handoverDocument.date, valueB: 'Brak kontaktu' });
        helpers.labeledLine(translation.recoveryLocation + ':', { value: "Tutaj tamtaj" });
        helpers.labeledLine(translation.retriever + ':', { value: handoverDocument.managerName });
        helpers.labeledLine(translation.witness + ':', { value: 'Khar Khar' });
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
        helpers.numberedClauses(translation.unilateralClauses)
        
        helpers.setY(770);
        helpers.signatureLine(translation.signatureWitness, translation.signatureManager);
    })
}


export const testHandoverUnilateralDocument = async (handoverDocument: DocumentGenerator.HandoverDocument | string) => {
    const { filePath } = await testDocument(handoverDocument, {
        getFunction: getVehicleHandovers<DocumentGenerator.HandoverDocumentRecord>,
        generateFunction: (record) => generateHandoverUnilateralDocument(record),
        description: "Unilateral Handover",
        key: "registrationNumber",
    });
    return filePath;
}

export default generateHandoverUnilateralDocument;