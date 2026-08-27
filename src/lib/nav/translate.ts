import axios from 'axios'

type TranslateFunction = (sentence: string, from: string, to: string) => Promise<string | null>

const translateGoogle: TranslateFunction = async (sentence, from = 'en', to = 'pl') => {
    sentence = encodeURIComponent(sentence);
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${from}&tl=${to}&dt=t&q=${sentence}&ie=UTF-8&oe=UTF-8`;
    const response = await axios.get(url);
    const result = response.data[0][0][0];
    return result;
}


const translateChrome: TranslateFunction = async (sentence, from = 'en', to = 'pl') => {
    sentence = encodeURIComponent(sentence);
    const num = Math.ceil(Math.random() * 3) + 2;
    const url = `https://clients${num}.google.com/translate_a/t?client=dict-chrome-ex&sl=${from}&tl=${to}&dt=t&q=${sentence}`;
    const response = await axios.get(url);
    const result = response.data[0];
    if (Array.isArray(result)) return result[0];
    return result;
}

export default {
    google: translateGoogle,
    chrome: translateChrome
}