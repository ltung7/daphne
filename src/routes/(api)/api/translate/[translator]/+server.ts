import type { RequestEvent } from './$types';
import { json, error } from '@sveltejs/kit';
import searchParamsToObject from '$lib/utils/parseUrlParams';
import { serverTranslate } from '$lib/server/services/translate.service';

const isTwoLetterCode = (value: unknown): value is string =>
    typeof value === 'string' && /^[a-zA-Z]{2}$/.test(value);

const isNonEmptyString = (value: unknown): value is string =>
    typeof value === 'string' && value.length > 0;

export const GET = async ({ url, params }: RequestEvent) => {
    const { from, to, sentence } = searchParamsToObject(url);

    if (!isTwoLetterCode(from)) throw error(400, 'from must be a 2-letter language code');
    if (!isTwoLetterCode(to)) throw error(400, 'to must be a 2-letter language code');
    if (!isNonEmptyString(params.translator)) throw error(400, 'translator must be a non-empty string');
    if (!isNonEmptyString(sentence)) throw error(400, 'sentence must be a non-empty string');

    const translated = await serverTranslate(params.translator, from, to, sentence);
    if (translated === null) throw error(502, 'Translation failed');

    return json({ translated });
};
