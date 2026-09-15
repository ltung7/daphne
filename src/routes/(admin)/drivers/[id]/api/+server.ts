import type { RequestHandler } from "./$types";
import { handleDriverPasswordResetEndpoint } from "$lib/server/services/users.service";

export const POST: RequestHandler = async ({ params, request }) => {
    const body = await request.json();
    return handleDriverPasswordResetEndpoint(params.id, body.action)
};