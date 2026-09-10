import { PdfHelpers, preparePdf } from "./pdf";
import translations from "./inspection.translations";
import { format } from "date-fns";
import { pl } from "date-fns/locale";
import { getVehicleInspection } from "$lib/server/db/firebase/vehicleInspections.fdb";
import { testDocument } from "$lib/utils/testDocument";

const PAPER = {
    margins: { top: 20, left: 20, right: 20, bottom: 20 },
    size: [ 595, 840 ] as [number, number],
};

type InspectionRecord = DocumentGenerator.InspectionDocumentRecord;

const DAILY_CATEGORIES: Vehicle.DailyInspectionCategory[] = [ 'tires', 'cleanliness', 'lost_property', 'dashboard_alerts' ];
const MONTHLY_CATEGORIES: Vehicle.MonthlyInspectionCategory[] = [ 'lighting', 'safety_gear', 'fluids', 'brakes', 'documentation' ];

const t = translations.pl;

interface ImageWithCategory {
    category: Vehicle.ImageInspectionCategory;
    buffer: Buffer;
}

function getChecklistLabel(category: string): string {
    const key = `daily_${category}` as keyof typeof t;
    if (key in t) {
        return t[key] as string;
    }
    const monthlyKey = `monthly_${category}` as keyof typeof t;
    if (monthlyKey in t) {
        return t[monthlyKey] as string;
    }
    return category;
}

function getImageLabel(category: Vehicle.ImageInspectionCategory): string {
    return t[category] as string || category;
}

const generateInspectionDocument = async (record: InspectionRecord, _send: boolean = false) => {
    const isMonthly = record.monthly === true;
    const dateStr = format(new Date(record.timestamp), 'dd.MM.yyyy HH:mm', { locale: pl });

    // Load images
    let images: ImageWithCategory[] = [];
    const imageEntries = Object.entries(record.images || {}) as [Vehicle.ImageInspectionCategory, App.StoredTempFile][];

    if (imageEntries.length) {
        images = await Promise.all(
            imageEntries.map(async ([ category, file ]) => {
                const buffer = await PdfHelpers.fetchImageBuffer(file.src);
                return { category, buffer };
            })
        );
    }

    const buffer = await preparePdf(PAPER, async (pdf) => {
        const helpers = new PdfHelpers(pdf, pdf.y);

        const subtitle = isMonthly ? t.monthlySubtitle : t.dailySubtitle;

        helpers.title(t.title);
        helpers.subtitle(subtitle);
        helpers.line();

        // Section 1: What, Who, When
        helpers.sectionHeader(t.section1Header);
        helpers.twoColLabeledLines(
            t.registrationNumber,
            t.driver,
            { valueA: record.registrationNumber, valueB: record.assignedDriverName || '—' }
        );
        helpers.twoColLabeledLines(
            t.date,
            t.uploader,
            { valueA: dateStr, valueB: record.uploader }
        );
        helpers.labeledLine(t.type + ':', { value: isMonthly ? t.monthlyCategory : t.dailyCategory });
        helpers.padY(6);

        // Section 2: Checklist
        helpers.sectionHeader(t.section2Header);

        const checklistCategories = isMonthly
            ? [ ...DAILY_CATEGORIES, ...MONTHLY_CATEGORIES ]
            : DAILY_CATEGORIES;

        for (const category of checklistCategories) {
            const label = getChecklistLabel(category);
            const result = (record.checklist as Record<string, boolean | undefined>)[category];

            let statusText = t.checklistItemNa;
            if (result === true) statusText = t.checklistItemPass;
            else if (result === false) statusText = t.checklistItemFail;

            helpers.labeledLine(label + ':', { value: statusText });
        }
        helpers.padY(6);

        // Section 3: Images
        if (images.length) {
            helpers.sectionHeader(t.section3Header);
            helpers.paragraph(t.imagesAttachment);
            helpers.padY(6);

            const subtitleText = t.imagesAttachmentText
                .replaceAll('{date}', dateStr)
                .replaceAll('{registrationNumber}', record.registrationNumber)
                .replaceAll('{driver}', record.assignedDriverName || '—');

            for (let i = 0; i < images.length; i++) {
                if (i % 3 === 0) {
                    helpers.addAttachmentPage(t.imagesAttachmentHeader, subtitleText);
                }
                helpers.padY(10);
                const img = images[i];
                const label = getImageLabel(img.category).replace('{i}', (i + 1).toString());
                helpers.drawImage(i + 1, img.buffer, label, 3);
            }
        }

        // Signatures
        helpers.setY(770);
        helpers.signatureLine(t.signatureInspector, t.signatureDriver);
    });

    return buffer;
};

export const testInspectionDocument = async (inspectionDocument: DocumentGenerator.InspectionDocumentRecord | string) => {
    const { filePath } = await testDocument(inspectionDocument, {
        getFunction: getVehicleInspection<DocumentGenerator.InspectionDocumentRecord>,
        generateFunction: generateInspectionDocument,
        description: "Inspection",
        key: "registrationNumber",
    });
    return filePath;
}

export default generateInspectionDocument;