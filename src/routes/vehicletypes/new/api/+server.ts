import { setVehicleType } from "$lib/server/db/firebase/vehicleType.fdb";
import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";

export const POST: RequestHandler = async ({ request }) => {
    const data = await request.json();
    const id = data.type?.id || (Date.now() - 1780000000000).toString(36)
    await setVehicleType(id, data.type);
    delete data.id;
    return json({ success: true, id })
};