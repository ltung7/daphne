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
            model: 'openrouter/free',
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

export default translateOpenRouter;