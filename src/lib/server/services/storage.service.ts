import { Storage } from '@google-cloud/storage';

export const BUCKETS = {
    FEED: "feed-cdn-files"
}

export const getMetadata = async (filename: string, bucket = BUCKETS.FEED) => {
    const storage = new Storage();
    return storage.bucket(bucket).file(filename).getMetadata();
}

export const uploadContents = async (contents: string | Buffer | Uint8Array, filename: string, bucket = BUCKETS.FEED) => {
    const storage = new Storage();
    await storage.bucket(bucket).file(filename).save(contents);
    return `https://storage.googleapis.com/${bucket}/${filename}`;
}