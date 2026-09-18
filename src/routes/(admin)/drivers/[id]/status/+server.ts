import { restrictAdmin } from "$lib/server/auth";
import { changeDriverStatus } from "$lib/server/services/driver.service";
import { getLatestVehicleDriverStatusChanges } from "$lib/server/db/firebase/vehicleDriverStatusChange.fdb";
import type { RequestHandler } from "./$types";
import { json } from "@sveltejs/kit";

export const PATCH: RequestHandler = async ({ params, request, locals }) => {
    const body = await request.json();
    const { status, ...extraData } = body;
    restrictAdmin(locals)

    const result = await changeDriverStatus(params.id, status, extraData, locals._user!);
    
    return json(result);
};

export const GET: RequestHandler = async ({ params, url, locals }) => {
    restrictAdmin(locals);
    
    const driverId = params.id;
    const offset = Number(url.searchParams.get('offset')) || 0;
    const limit = Number(url.searchParams.get('limit')) || 10;
    
    const changes = await getLatestVehicleDriverStatusChanges(driverId, offset, limit);
    
    return json(changes);
};