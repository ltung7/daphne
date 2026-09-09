import { generateUploadUrl } from '$lib/server/services/storage.service';
import { json } from '@sveltejs/kit';

export const GET = async ({ url }) => {
    const filename = url.searchParams.get('filename') || 'default';
    const contentType = url.searchParams.get('contentType') || 'image/jpeg';

    const { signedUrl, expires } = await generateUploadUrl(filename, contentType);

    return json({ success: true, signedUrl, expires })
};