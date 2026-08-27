import { Storage, type GetSignedUrlConfig } from '@google-cloud/storage';
const storage = new Storage();

export const BUCKETS: Record<string, App.BucketName> = {
    FEED: "feed-cdn-files",
    TEMP: "mpt_tmp_imgs"
} as const;

export const getMetadata = async (filename: string, bucket: App.BucketName = BUCKETS.FEED) => {
    const storage = new Storage();
    return storage.bucket(bucket).file(filename).getMetadata();
}

export const uploadContents = async (contents: string | Buffer | Uint8Array, filename: string, bucket: App.BucketName = BUCKETS.FEED) => {
    await storage.bucket(bucket).file(filename).save(contents);
    return `https://storage.googleapis.com/${bucket}/${filename}`;
}

export const moveCloudFile = async (
    filename: string,
    bucketFrom: App.BucketName = BUCKETS.TEMP,
    bucketTo: App.BucketName = BUCKETS.FEED
): Promise<string> => {
    const sourceFile = storage.bucket(bucketFrom).file(filename);
    const destinationFile = storage.bucket(bucketTo).file(filename);

    // Moves the object to the target bucket and deletes the original
    await sourceFile.move(destinationFile);

    return `https://storage.googleapis.com/${bucketTo}/${filename}`;
};

export const generateDownloadUrl = async (
    filename: string,
    bucket: App.BucketName = BUCKETS.FEED
): Promise<string> => {
    // 15 minutes converted to milliseconds
    const FIFTEEN_MINUTES_MS = 15 * 60 * 1000;

    const options: GetSignedUrlConfig = {
        version: 'v4',
        action: 'read',
        expires: Date.now() + FIFTEEN_MINUTES_MS,
    };

    // getSignedUrl returns an array; destructure the first element (the URL string)
    const [ signedUrl ] = await storage
        .bucket(bucket)
        .file(filename)
        .getSignedUrl(options);

    return signedUrl;
};