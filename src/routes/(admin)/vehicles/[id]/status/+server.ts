import { restrictAdmin } from "$lib/server/auth";
import { changeVehicleStatus } from "$lib/server/services/vehicleStatus.service";
import { getLatestVehicleStatusChanges } from "$lib/server/db/firebase/vehicleStatusChange.fdb";
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

export const GET: RequestHandler = async ({ params, url, locals }) => {
    restrictAdmin(locals);
    
    const registrationNumber = params.id;
    const offset = Number(url.searchParams.get('offset')) || 0;
    const limit = Number(url.searchParams.get('limit')) || 10;
    
    const events = await getLatestVehicleStatusChanges(registrationNumber, offset, limit);
    
    return json({ events });
};