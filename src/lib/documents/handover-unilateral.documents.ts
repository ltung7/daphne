import translations from "./handover.translations";
import { PdfHelpers, preparePdf } from "./pdf";

const PAPER = {
    margins: { top: 20, left: 20, right: 20, bottom: 20 },
    size: [ 595, 840 ],
}

const generateHandoverUnilateralDocument = async (variables: DocumentGenerator.HandoverDocument) => {
    return preparePdf(PAPER, (pdf) => {
        const helpers = new PdfHelpers(pdf, pdf.y);
        const translation = translations.pl;

        helpers.title(translation.title);
        helpers.subtitle(translation.unilateralSubtitle);
        helpers.line();

        helpers.sectionHeader(translation.section1Header);
        helpers.twoColLabeledLines(translation.date, translation.reasonForRecovery, { valueA: variables.date, valueB: 'Brak kontaktu' });
        helpers.labeledLine(translation.recoveryLocation + ':', { value: "Tutaj tamtaj" });
        helpers.labeledLine(translation.retriever + ':', { value: variables.managerName });
        helpers.labeledLine(translation.witness + ':', { value: 'Khar Khar' });
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
        helpers.notesBox(4, variables.visual);
        helpers.padY(6);

        helpers.sectionHeader(translation.section5Header);
        helpers.numberedClauses(translation.unilateralClauses)
        
        helpers.setY(770);
        helpers.signatureLine(translation.signatureWitness, translation.signatureManager);
    })
}

export default generateHandoverUnilateralDocument;