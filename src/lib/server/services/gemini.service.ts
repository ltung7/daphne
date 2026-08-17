import { GoogleGenerativeAI, type ModelParams, type RequestOptions } from '@google/generative-ai';
import { GEMINI_API_KEY } from "$env/static/private"
import { thrower } from '$lib/utils/logger';

const DEFAULT_MODEL = 'gemini-2.5-flash-lite'

export async function generateTextGemini(prompt: string, config: ModelParams = { model: DEFAULT_MODEL }, options: RequestOptions = {}) {
    const apiKey = GEMINI_API_KEY;

    if (!apiKey) {
        throw new Error('GEMINI_API_KEY not found in .env file. Please create a .env file with your API key.');
    }

    if (!config.model) config.model = DEFAULT_MODEL;
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel(config, options);

    try {
        const result = await model.generateContent(prompt);
        const response = result.response;
        const text = response.text();
        return text;
    } catch (error) {
        const message = thrower.getMessage(error)
        throw new Error("Error generating content: " + message);
    }
}