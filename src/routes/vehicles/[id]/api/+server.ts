import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { updateVehicle } from "$lib/server/db/firebase/vehicles.fdb";

export const PATCH: RequestHandler = async ({ request, params }) => {
    const data = await request.json();
    await updateVehicle(params.id, data);
    return json({ success: true })
};