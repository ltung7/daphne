import { getVehicleType } from "$lib/server/db/firebase/vehicleType.fdb";
import { json, error } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";

export const GET: RequestHandler = async ({ params, setHeaders }) => {
    const { id } = params;
    
    if (!id) {
        throw error(400, "Vehicle type ID is required");
    }

    const vehicleType = await getVehicleType(id);

    if (!vehicleType) {
        throw error(404, "Vehicle type not found");
    }

    if (import.meta.env.DEV) {
        setHeaders({
            "cache-control": "max-age=60000"
        });
    } else {
        setHeaders({
            "cache-control": "max-age=300"
        });
    }

    return json({ success: true, vehicleType });
};