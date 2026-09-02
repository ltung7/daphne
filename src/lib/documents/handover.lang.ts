// Translations for the Vehicle Handover and Acceptance protocol document.
// Flat structure: one key per piece of text, mirroring the fields used
// in the document template. Add more locales by adding another key

import { getVehicleHandoverTranslation } from "$lib/server/db/firebase/vehicleHandoverTranslation.fdb";
import translations from "./handover.translations";

export function fuseTranslations(
    primary: DocumentGenerator.HandoverDocumentTranslations,
    secondary: DocumentGenerator.HandoverDocumentTranslations,
    separator: string = ' / '
): DocumentGenerator.HandoverDocumentTranslations {
    const result = { _foreign: secondary } as DocumentGenerator.HandoverDocumentTranslations;

    for (const key of Object.keys(primary) as (keyof DocumentGenerator.HandoverDocumentTranslations)[]) {
        const value = primary[key];

        if (Array.isArray(value)) {
            result[key] = [] as never;
            continue;
        }

        const sec = secondary[key];

        result[key] = (
            sec
                ? `${value}${separator}${sec}`
                : value
        ) as never;
    }

    return result;
}

export async function getTranslations(
    locale?: DocumentGenerator.Locale
): Promise<DocumentGenerator.HandoverDocumentTranslations> {
    if (!locale || locale === 'pl') {
        return translations.pl
    }

    let foreign = await getVehicleHandoverTranslation(locale)
    if (!foreign) foreign = await getVehicleHandoverTranslation('en');
    return fuseTranslations(translations.pl, foreign ?? translations.pl)
}