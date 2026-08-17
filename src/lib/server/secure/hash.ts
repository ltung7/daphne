import { createHash } from 'crypto';

export default function hash(text: string | undefined, algo: string = 'sha256', result: "base64" | "base64url" | "hex" | "binary" = 'hex'): string {
    if (!text) throw new Error('Invalid text');
    return createHash(algo).update(text).digest(result);
}