import axios from "axios";
import { env } from "$env/dynamic/private"
import { logger } from "$lib/utils/logger";

const translateOpenRouter: App.TranslateFunction = async (sentence, from = 'en', to = 'pl') => {
    const apiKey = env.OPENROUTER_API_KEY;

    if (!apiKey) {
        throw new Error('OPENROUTER_API_KEY environment variable is missing.');
    }

    // Use system prompting to strictly enforce a direct translation response
    const response = await axios.post(
        'https://openrouter.ai/api/v1/chat/completions',
        {
            // 'openrouter/free' picks an available free model automatically.
            // Alternatively, specify a explicit model like 'google/gemma-4-31b-it:free'
            model: 'google/gemma-2-9b-it:free',
            messages: [
                {
                    role: 'system',
                    content: `You are a professional translator. Translate the text from language code "${from}" to language code "${to}". Output ONLY the raw translated text, with no extra conversational responses, quotes, or markdown wrappers.`
                },
                {
                    role: 'user',
                    content: sentence
                }
            ],
            temperature: 0.1 // Low temperature prevents creative rewrites
        },
        {
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
                // Optional tracking headers requested by OpenRouter
                'X-Title': 'Node Translator App'
            }
        }
    ).catch((err) => {
        logger.error(err.response.data.error.message)
        return null;
    });
    if (!response) return null;
    logger.log('Translated using: ' + response.data.model);
    const rawTranslation = response.data.choices[0].message.content;

    // Trim extraneous whitespace or surrounding quotation marks
    return rawTranslation.trim().replace(/^"(.*)"$/, '$1');
};

type TranslatableValue = string | Record<string, string> | string[];

interface TranslatedNode {
    key: string;
    type: 'string' | 'object' | 'array';
    value?: string;
    arrayItems?: string[];
    children?: TranslatedNode[];
}

interface JsonTranslateResponse {
    sourceLang: string;
    targetLang: string;
    nodes: TranslatedNode[];
}

export const translateObjectJsonWithOpenRouter = async (
    jsonObject: Record<string, TranslatableValue>,
    from = 'en',
    to = 'pl'
): Promise<JsonTranslateResponse> => {
    const apiKey = env.OPENROUTER_API_KEY;

    if (!apiKey) {
        throw new Error('OPENROUTER_API_KEY environment variable is missing.');
    }

    const systemPrompt = `You are a professional localization parser. Translate all text values from language "${from}" to "${to}". 
Preserve all JSON object keys exactly as provided. Map nested structures according to the schema below.
Output ONLY valid JSON matching this schema:
{
  "sourceLang": "string",
  "targetLang": "string",
  "nodes": [
    {
      "key": "string",
      "type": "string" | "object" | "array",
      "value": "string (if type=string)",
      "arrayItems": ["string"] (if type=array),
      "children": [...] (if type=object)
    }
  ]
}
No extra text, no markdown, no explanations.`;

    const response = await axios.post(
        'https://openrouter.ai/api/v1/chat/completions',
        {
            model: 'google/gemma-2-9b-it:free',
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: JSON.stringify(jsonObject, null, 2) }
            ],
            temperature: 0.1,
            response_format: { type: 'json_object' }
        },
        {
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
                'X-Title': 'Node Translator App'
            }
        }
    ).catch((err) => {
        logger.error(err.response?.data?.error?.message || err.message);
        return null;
    });

    if (!response) return { sourceLang: from, targetLang: to, nodes: [] };

    logger.log('Translated JSON using: ' + response.data.model);
    const rawContent = response.data.choices[0].message.content;

    try {
        return JSON.parse(rawContent) as JsonTranslateResponse;
    } catch (_e) {
        logger.error('Failed to parse OpenRouter JSON translation response:', rawContent);
        return { sourceLang: from, targetLang: to, nodes: [] };
    }
};

export default translateOpenRouter;