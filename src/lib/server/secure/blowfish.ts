import { randomString } from '$lib/utils/randomString'
import { env } from '$env/dynamic/private';
import { Blowfish } from 'egoroof-blowfish';

export const encrypt = (text: string) => {
    const iv = randomString(8);
    const salt = randomString(8)
    const encrypted = encryptIvSalt(text, iv, salt);
    return [ iv, salt, encrypted ].join('$');
}

const encryptIvSalt = (text: string, iv: string, salt: string) => {
    const key = env.BF_SECRET;
    const cipher = new Blowfish(key, Blowfish.MODE.CBC, Blowfish.PADDING.ONE_AND_ZEROS);
    cipher.setIv(iv);
    const encryptedArray = cipher.encode(salt + text);
    return Buffer.from(encryptedArray).toString('base64').replaceAll('/','0').replaceAll('+','9');
}

export const verify = (text: string, encryptedString: string) => {
    const [ iv, salt, encrypted ] = encryptedString.split('$');
    const newEncrypted = encryptIvSalt(text, iv, salt);
    return newEncrypted === encrypted;
}

export default {
    encrypt,
    verify
}