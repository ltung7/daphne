import { sendEnvelope } from "$lib/server/services/docusign.service";
import { getTranslations, translations } from "./handover.lang";
import { PdfHelpers, preparePdf } from "./pdf";

const PAPER = {
    margins: { top: 20, left: 20, right: 20, bottom: 20 },
    size: [ 595, 840 ],
}

const generateHandoverDocument = async (variables: DocumentGenerator.HandoverDocument) => {
    const buffer = await preparePdf(PAPER, (pdf) => {
        const helpers = new PdfHelpers(pdf, pdf.y);
        const translation = getTranslations(variables.locale);

        helpers.title(translation.title);
        helpers.subtitle(translation.handoverSubtitle);
        helpers.line();

        helpers.sectionHeader(translation.section1Header);
        helpers.twoColLabeledLines(translation.place, translation.date, { valueA: variables.place, valueB: variables.date });
        helpers.labeledLine(translation.manager + ':', { value: variables.owner + ', ' + variables.managerName });
        helpers.labeledLine(translation.driver + ":", { value: variables.driverName +', ' + variables.driverIdentification });
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
        if (!variables.locale || variables.locale === 'pl') {
            helpers.numberedClauses(translations.pl.handoverClauses)
        } else {
            const clauseLocale = translations[variables.locale] ?? translations.en;
            helpers.twoColNumberedClauses(translations.pl.handoverClauses, clauseLocale.handoverClauses)
        }

        helpers.setY(770);
        helpers.signatureLine(translation.signatureDriver, translation.signatureManager);
    })

    if (variables.send) {
        await sendEnvelope({
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
            }
        })
    }

    return buffer;
}

export default generateHandoverDocument;