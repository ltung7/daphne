import crypto from 'crypto'
import { env } from '$env/dynamic/private';

export const setAccess = (message: string | undefined, algorithm : string= 'aes-256-cbc') => {
    if (!message) throw new Error('Invalid string');
    const secret = env.AC_SECRET;
    const iv = Uint8Array.from(crypto.randomBytes(16));
    const cipher = crypto.createCipheriv(algorithm, secret, iv);
    const ciphertext = Buffer.concat([
        iv, 
        Uint8Array.from(cipher.update(message)), 
        Uint8Array.from(cipher.final())
    ]);
    return ciphertext.toString('base64');
}

export const checkAccess = (ciphertext: string | undefined, algorithm : string= 'aes-256-cbc') => {
    if (!ciphertext) throw new Error('Invalid string');
    const secret = env.AC_SECRET;
    const ciphertextBytes = Buffer.from(ciphertext, 'base64');
    const iv = Uint8Array.from(crypto.randomBytes(16));
    const data = ciphertextBytes.slice(16);
    const decipher = crypto.createDecipheriv(algorithm, secret, iv);
    const plaintextBytes = Buffer.concat([ 
        Uint8Array.from(decipher.update(Uint8Array.from(data))), 
        Uint8Array.from(decipher.final()) 
    ]);
    return JSON.parse(plaintextBytes.toString('utf8'));
}