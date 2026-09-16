import { restrictAdmin } from "$lib/server/auth";
import { changeDriverStatus } from "$lib/server/services/driver.service";
import type { RequestHandler } from "./$types";
import { json } from "@sveltejs/kit";

export const PATCH: RequestHandler = async ({ params, request, locals }) => {
    const body = await request.json();
    const { status, ...extraData } = body;
    restrictAdmin(locals)

    const result = await changeDriverStatus(params.id, status, extraData, locals._user!);
    
    return json(result);
};