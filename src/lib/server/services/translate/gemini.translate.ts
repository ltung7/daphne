import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';
import { env } from "$env/dynamic/private"

// Initialize with your API key from environment variables
const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY || '');

export const translateFlashLite: App.TranslateFunction = async (sentence, from = 'en', to = 'pl') => {
    const model = genAI.getGenerativeModel({
        model: 'gemini-2.5-flash-lite',
        systemInstruction: `Translate the text from language code "${from}" to language code "${to}". Output ONLY the direct translated string with no extra text or markdown formatting.`,
        generationConfig: {
            temperature: 0.1,
        },
    });

    const result = await model.generateContent(sentence);
    return result.response.text().trim();
};

export const translateFlashStandard: App.TranslateFunction = async (sentence, from = 'en', to = 'pl') => {
    const model = genAI.getGenerativeModel({
        model: 'gemini-2.5-flash',
        systemInstruction: `You are an expert localization translator. Translate from "${from}" to "${to}". Retain natural phrasing, localized tone, and intent. Output strictly the translation without explanations.`,
        generationConfig: {
            temperature: 0.2,
        },
    });

    const result = await model.generateContent(sentence);
    return result.response.text().trim();
};

type TranslatableValue = string | Record<string, string> | string[];

interface TranslationItem {
    key: string;
    original: string;
    translated: string;
}

interface JsonTranslateResponse {
    sourceLang: string;
    targetLang: string;
    translations: TranslationItem[];
}

interface TranslatedNode {
    key: string;
    type: 'string' | 'object' | 'array';
    value?: string;           // Populated if type === 'string'
    arrayItems?: string[];    // Populated if type === 'array'
    children?: TranslatedNode[]; // Populated if type === 'object'
}

interface JsonTranslateResponse {
    sourceLang: string;
    targetLang: string;
    nodes: TranslatedNode[];
}

export const translateObjectJson = async (
    jsonObject: Record<string, TranslatableValue>,
    from = 'en',
    to = 'pl'
): Promise<JsonTranslateResponse> => {
    const model = genAI.getGenerativeModel({
        model: 'gemini-2.5-flash',
        systemInstruction: `You are a professional localization parser. Translate all text values from language "${from}" to "${to}". Preserve all JSON object keys exactly as provided. Map nested structures according to the provided schema.`,
        generationConfig: {
            temperature: 0.1,
            responseMimeType: 'application/json',
            responseSchema: {
                type: SchemaType.OBJECT,
                properties: {
                    sourceLang: { type: SchemaType.STRING },
                    targetLang: { type: SchemaType.STRING },
                    nodes: {
                        type: SchemaType.ARRAY,
                        items: {
                            type: SchemaType.OBJECT,
                            properties: {
                                key: { type: SchemaType.STRING },
                                type: { type: SchemaType.STRING, format: 'enum', enum: [ 'string', 'object', 'array' ] },
                                value: { type: SchemaType.STRING },
                                arrayItems: {
                                    type: SchemaType.ARRAY,
                                    items: { type: SchemaType.STRING },
                                },
                                children: {
                                    type: SchemaType.ARRAY,
                                    items: {
                                        type: SchemaType.OBJECT,
                                        properties: {
                                            key: { type: SchemaType.STRING },
                                            type: { type: SchemaType.STRING, format: 'enum', enum: [ 'string', 'array' ] },
                                            value: { type: SchemaType.STRING },
                                            arrayItems: {
                                                type: SchemaType.ARRAY,
                                                items: { type: SchemaType.STRING },
                                            },
                                        },
                                        required: [ 'key', 'type' ],
                                    },
                                },
                            },
                            required: [ 'key', 'type' ],
                        },
                    },
                },
                required: [ 'sourceLang', 'targetLang', 'nodes' ],
            },
        },
    });

    const result = await model.generateContent(JSON.stringify(jsonObject, null, 2));
    const responseText = result.response.text();

    return JSON.parse(responseText || '{}') as JsonTranslateResponse;
};