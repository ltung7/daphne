import { z } from 'zod';
import c from './common.zod'

export const handoverDocumentSchema = z.object({
    // Non-empty string fields
    place: c.nonEmptyString('Miejsce'),
    date: c.nonEmptyString('Data'),
    owner: c.nonEmptyString('Właściciel'),

    // Can be empty strings
    managerName: c.firstAndLastName(),
    managerEmail: z.email('Niepoprawny format adresu email'),

    // Driver details
    driverName: c.firstAndLastName(),
    driverId: c.nonEmptyString('driverId'),
    driverEmail: z.email('Niepoprawny format adresu email kierowcy'),

    // Identification document
    // Note: If IdentificationDocumentType is a TypeScript enum, replace z.string() with z.nativeEnum(IdentificationDocumentType)
    identificationDocumentType: c.nonEmptyString('Typ dokumentu tożsamości'),
    identificationDocumentNumber: c.nonEmptyString('Numer dokumentu tożsamości'),

    // Vehicle details
    model: c.nonEmptyString('Model'),
    registrationNumber: c.nonEmptyString('Numer rejestracyjny'),
    vin: c.nonEmptyString('Numer VIN'),
    milage: z
        .string()
        .min(1, 'Przebieg jest wymagany')
        .regex(/^\d+$/, 'Przebieg musi składać się wyłącznie z cyfr'),
    remaining: c.nonEmptyString('Stan paliwa/baterii'),
    visual: c.nonEmptyString('Stan wizualny'),
    translatedVisual: z.string(),
    isElectric: z.boolean(),

    // Locale (Replace z.string() with z.nativeEnum(DocumentGenerator.Locale) if it is a TS enum)
    locale: z.custom<DocumentGenerator.Locale>((val) => typeof val === 'string' && val.length > 0, {
        message: 'Język dokumentu jest wymagany',
    }),
    images: z.array(z.string()),

    // Equipment booleans
    key: z.boolean(),
    spareKey: z.boolean(),
    registration: z.boolean(),
    roofSign: z.boolean(),
    tire: z.boolean(),
    fuelCard: z.boolean(),
    exinguisher: z.boolean(),
    triangle: z.boolean(),
    firstAidKit: z.boolean(),
    vest: z.boolean(),
    mats: z.boolean(),
    phoneHolder: z.boolean(),
    phoneCharger: z.boolean(),
    carWashCard: z.boolean(),
});

export type HandoverDocument = z.infer<typeof handoverDocumentSchema>;