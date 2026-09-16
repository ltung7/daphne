import { restrictAdmin } from "$lib/server/auth";
import { changeVehicleStatus } from "$lib/server/services/vehicleStatus.service";
import type { RequestHandler } from "./$types";
import { json } from "@sveltejs/kit";

export const PATCH: RequestHandler = async ({ params, request, locals }) => {
    const body = await request.json();
    const { status, ...extraData } = body;
    restrictAdmin(locals)

    // Assuming params.id is the vehicle registration number
    const result = await changeVehicleStatus(params.id, status, extraData, locals._user!);
    
    return json(result);
};