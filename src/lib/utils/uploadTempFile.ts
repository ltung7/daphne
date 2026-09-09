import { internal } from "$lib/nav/internal";

/**
 * Uploads a file directly to Google Cloud Storage using a pre-signed URL.
 * 
 * @param file - The File object to upload.
 * @returns Object containing `bucket` and `fileName` for GCS operations.
 */
export async function uploadTempFile(file: File): Promise<App.StoredTempFile> {
    // 1. Fetch the signed link details using your internal fetch wrapper
    const data = (await internal.get('/upload/signed?filename=' + file.name)) as App.BucketSignedLink;
    if (!data?.signedUrl) {
        throw new Error("Failed to retrieve signed URL from server.");
    }

    // 2. Upload the file directly to Google Cloud Storage via HTTP PUT
    const uploadResponse = await fetch(data.signedUrl, {
        method: 'PUT',
        headers: {
            'Content-Type': file.type || 'image/jpeg',
        },
        body: file,
    });

    if (!uploadResponse.ok) {
        throw new Error(`Direct GCS upload failed with status ${uploadResponse.status}`);
    }

    // 3. Extract bucket and fileName from the signed URL
    const url = new URL(data.signedUrl);
    const pathSegments = url.pathname.split('/').filter(Boolean);

    let bucket = '';
    let fileName = '';

    // Handles virtual-hosted URLs (bucket.storage.googleapis.com) vs path-style URLs (storage.googleapis.com/bucket/file)
    if (url.hostname.endsWith('.storage.googleapis.com') && url.hostname !== 'storage.googleapis.com') {
        bucket = url.hostname.replace('.storage.googleapis.com', '');
        fileName = pathSegments.join('/');
    } else {
        bucket = pathSegments[0] || '';
        fileName = pathSegments.slice(1).join('/');
    }

    const src = url.origin + url.pathname;
    return { bucket, fileName, src } as App.StoredTempFile;
}