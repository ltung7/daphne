import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { updateVehicle } from "$lib/server/db/firebase/vehicles.fdb";
import { getVehicle } from "$lib/server/db/firebase/vehicles.fdb";
import { error } from "console";

export const GET: RequestHandler = async ({ params }) => {
    const vehicle = await getVehicle<Vehicle.Vehicle>(params.id);
    if (!vehicle) throw error(404, 'Vehicle not found')
    return json({ success: true, vehicle });
}

export const PATCH: RequestHandler = async ({ request, params }) => {
    const data = await request.json();
    await updateVehicle(params.id, data);
    return json({ success: true })
};