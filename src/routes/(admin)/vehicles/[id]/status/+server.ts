import { changeVehicleStatus } from "$lib/server/services/vehicleStatus.service";
import type { RequestHandler } from "./$types";
import { json } from "@sveltejs/kit";

export const PATCH: RequestHandler = async ({ params, request }) => {
    const body = await request.json();
    const { status, ...extraData } = body;

    // Assuming params.id is the vehicle registration number
    const result = await changeVehicleStatus(params.id, status, extraData);
    
    return json(result);
};