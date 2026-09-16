import { changeDriverStatus } from "$lib/server/services/driver.service";
import type { RequestHandler } from "./$types";
import { json } from "@sveltejs/kit";

export const PATCH: RequestHandler = async ({ params, request }) => {
    const body = await request.json();
    const { status, ...extraData } = body;

    const result = await changeDriverStatus(params.id, status, extraData);
    
    return json(result);
};