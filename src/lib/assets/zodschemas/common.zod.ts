import { z } from 'zod';

const nonEmptyString = (fieldDescription: string) =>
    z.string().min(1, `${fieldDescription} jest wymagane`);

const firstAndLastName = () =>
    z.string()
        .trim()
        .min(3, { error: 'Imię i nazwisko jest za krótkie' })
        .refine(
            (val) => val.split(/\s+/).length >= 2,
            { error: 'Wymagane jest podanie co najmniej imienia i nazwiska' }
        );

export default {
    nonEmptyString,
    firstAndLastName
}