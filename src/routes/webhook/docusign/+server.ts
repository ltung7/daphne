import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { processDocusignWebhook } from "$lib/server/services/docusign/docusignWebhook.service";

export const GET: RequestHandler = async () => {
    return json({ success: true, webhook: 'Docusign' })
};

export const POST: RequestHandler = async ({ request }) => {
    const data = await request.json();
    processDocusignWebhook(data)
    return json({ success: true })
};