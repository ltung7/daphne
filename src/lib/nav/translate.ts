import axios from 'axios'

const translateGoogle: App.TranslateFunction = async (sentence, from = 'en', to = 'pl') => {
    sentence = encodeURIComponent(sentence);
    const url = `https://translate.googleapis.com/translate_a/single?client=dict-chrome-ex&sl=${from}&tl=${to}&dt=t&q=${sentence}&ie=UTF-8&oe=UTF-8`;
    const response = await axios.get(url);
    const result = response.data[0];
    if (Array.isArray(result)) return result[0];
}


const translateChrome: App.TranslateFunction = async (sentence, from = 'en', to = 'pl') => {
    sentence = encodeURIComponent(sentence);
    const num = Math.ceil(Math.random() * 3) + 2;
    const url = `https://clients${num}.google.com/translate_a/t?client=dict-chrome-ex&sl=${from}&tl=${to}&dt=t&q=${sentence}`;
    const response = await axios.get(url);
    const result = response.data[0];
    if (Array.isArray(result)) return result[0];
    return result;
}

const _translateLingva: App.TranslateFunction = async (sentence, from = 'en', to = 'pl') => {
    const encodedSentence = encodeURIComponent(sentence);
    const url = `https://lingva.ml/api/v1/${from}/${to}/${encodedSentence}`;
    const response = await axios.get(url);
    return response.data.translation;
};

const _translateLibre: App.TranslateFunction = async (sentence, from = 'en', to = 'pl') => {
    // You can swap the host to any active mirror (e.g., translate.terraprint.co)
    const response = await axios.post('https://translate.argosopentech.com/translate', {
        q: sentence,
        source: from,
        target: to,
        format: 'text'
    }, {
        headers: { 'Content-Type': 'application/json' }
    });
    return response.data.translatedText;
};

export const serverTranslate = (translator: string): App.TranslateFunction => {
  return async (sentence, from = 'en', to = 'pl') => {
    const response = await axios.get<{ translated: string | null}>(`/api/translate/${translator}`, {
      params: {
        from,
        to,
        sentence // Axios automatically encodes parameters passed in the params object
      }
    });

    return response.data.translated;
  };
};

export const browserTranslate: Record<string, App.TranslateFunction> = {
    google: translateGoogle,
    chrome: translateChrome,
}

export default {
    ...browserTranslate,
    openRouter: serverTranslate('openRouter'),
    geminiFlash: serverTranslate('geminiFlash'),
    gemini: serverTranslate('gemini'),
    // lingva: translateLingva
}