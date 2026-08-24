import { z } from 'zod';
import c from './common.zod'

const drivingLicenseCategorySchema = z.enum([
    'AM', 'A1', 'A2', 'A',
    'B1', 'B', 'B+E',
    'C1', 'C1+E', 'C', 'C+E',
    'D1', 'D1+E', 'D', 'D+E',
    'T',
]);

const drivingLicenseSchema = z.object({
    number: z.string().min(1, { error: 'Numer prawa jazdy jest wymagany' }),
    category: drivingLicenseCategorySchema,
    expirationDate: z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/, { error: 'Wymagany format daty to YYYY-MM-DD' }),
    issuingCountry: z
        .string()
        .regex(/^[A-Z]{2}$/, { error: 'Kod kraju wydania musi składać się z 2 wielkich liter (np. PL)' }),
});

const identificationDocumentTypeSchema = z.enum([
    'polish_id_card',
    'passport',
    'residence_card',
    'temporary_residence_card',
    'travel_document',
]);

const taxiAuthorizationSchema = z.object({
    registryEntryNumber: z.string().min(1, { error: 'Numer wpisu do rejestru jest wymagany' }),
    market: z.string().min(1, { error: 'Wskazanie gminy/miasta jest wymagane' }),
    expirationDate: z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/, { error: 'Wymagany format daty to YYYY-MM-DD' }),
});

const polishMobilePhoneSchema = z
    .string()
    .regex(/^[+\d\s()-]+$/, {
        error: 'Numer telefonu może zawierać tylko cyfry oraz znaki: +, -, (, ), spacje',
    })
    .refine(
        (val) => {
            // Usunięcie wszystkich znaków niebędących cyframi
            const digits = val.replace(/\D/g, '');

            // Wyciągnięcie właściwego 9-cyfrowego numeru krajowego
            let national = digits;
            if (digits.startsWith('48') && digits.length === 11) {
                national = digits.slice(2);
            } else if (digits.startsWith('0048') && digits.length === 13) {
                national = digits.slice(4);
            }

            // Sprawdzenie długości (w Polsce numer bez kierunkowego kraju ma 9 cyfr)
            if (national.length !== 9) return false;

            // Prefiksy polskich operatorów komórkowych (45, 50, 51, 53, 57, 60, 66, 69, 72, 73, 78, 79, 88)
            return /^(?:45|5[0137]|6[069]|7[2389]|88)\d{7}$/.test(national);
        },
        { error: 'Wymagany jest prawidłowy polski numer komórkowy (9 cyfr)' }
    );

export const newDriverDataSchema = z
    .object({
        // id: z.string().min(1, { error: 'Identyfikator jest wymagany' }),
        login: z
            .string()
            .min(6, { error: 'Login musi mieć co najmniej 6 znaków' })
            .regex(/^[a-zA-Z0-9]+$/, { error: 'Login może zawierać tylko litery i cyfry' }),
        name: c.firstAndLastName(),
        sex: z.enum([ 'm', 'f', 'o' ]),

        // Dane kontaktowe (użycie top-level validatorów Zod 4)
        phone: polishMobilePhoneSchema,
        email: z.email({ error: 'Nieprawidłowy adres e-mail' }),
        address: z.string().min(1, { error: 'Adres jest wymagany' }),

        // Uprawnienia i dokumenty
        drivingLicenses: z
            .array(drivingLicenseSchema),
        // .min(1, { error: 'Wymagane jest wprowadzenie co najmniej jednego prawa jazdy' }),
        // nationality: z
        //     .string()
        //     .regex(/^[A-Z]{2}$/, { error: 'Kod narodowości musi składać się z 2 wielkich liter ISO (np. PL)' }),
        identificationDocumentType: identificationDocumentTypeSchema,
        identificationDocumentNumber: z.string().min(1, { error: 'Numer dokumentu jest wymagany' }),
        taxiAuthorization: taxiAuthorizationSchema.optional(),

        // Znajomość języków
        polishLanguage: z.enum([ 'native', 'fluent', 'basic' ]),
        additionalLanguages: z.record(z.string(), z.enum([ 'native', 'fluent' ])),

        notes: z.string(),
    })
    .superRefine((data, ctx) => {
        const docType = data.identificationDocumentType;
        const docNum = data.identificationDocumentNumber.trim();

        // 1. Walidacja numeru dokumentu tożsamości
        if (docType === 'polish_id_card') {
            if (!/^[A-Z]{3}\d{6}$/.test(docNum)) {
                ctx.addIssue({
                    code: 'custom',
                    message: 'Numer dowodu osobistego musi składać się z 3 liter i 6 cyfr (np. ABC123456)',
                    path: [ 'identificationDocumentNumber' ],
                });
            }
        } else if (docType === 'residence_card' || docType === 'temporary_residence_card') {
            if (!/^[A-Z]{2}\d{7}$/.test(docNum)) {
                ctx.addIssue({
                    code: 'custom',
                    message: 'Numer karty pobytu musi składać się z 2 liter i 7 cyfr (np. AB1234567)',
                    path: [ 'identificationDocumentNumber' ],
                });
            }
        } else if (docType === 'passport' || docType === 'travel_document') {
            if (!/^[A-Z0-9]{6,12}$/i.test(docNum)) {
                ctx.addIssue({
                    code: 'custom',
                    message: 'Numer dokumentu musi zawierać od 6 do 12 znaków alfanumerycznych',
                    path: [ 'identificationDocumentNumber' ],
                });
            }
        }

        // 2. Wymóg językowy
        if (data.polishLanguage === 'basic') {
            const hasFluentOrNativeAdditional = Object.values(data.additionalLanguages).some(
                (level) => level === 'native' || level === 'fluent'
            );

            if (!hasFluentOrNativeAdditional) {
                ctx.addIssue({
                    code: 'custom',
                    message:
                        'W przypadku podstawowej znajomości języka polskiego wymagana jest znajomość przynajmniej jednego innego języka na poziomie biegłym lub ojczystym.',
                    path: [ 'additionalLanguages' ],
                });
            }
        }
    });

export type NewDriverDataInput = z.infer<typeof newDriverDataSchema>;