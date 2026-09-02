import  { browserTranslate } from "$lib/nav/translate";
import { logger } from "$lib/utils/logger";
import { translateFlashLite, translateFlashStandard } from "./translate/gemini.translate";
import openRouter from "./translate/openRouter.translate";


const serverTranslateFunction: Record<string, App.TranslateFunction> = {
    ...browserTranslate,
    openRouter,
    geminiFlash: translateFlashLite,
    gemini: translateFlashStandard
}

export const serverTranslate = (translator: string, from: string, to: string, sentence: string): Promise<string | null> => {
    const translate = serverTranslateFunction[translator];
    if (translate) return translate(sentence, from, to);
    else {
        logger.log('Translation - falling back to chrome')
        return browserTranslate.chrome(sentence, from, to);
    }
}