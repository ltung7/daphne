import { findVehicleType } from "$lib/server/db/firebase/vehicleType.fdb";
import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { parseFiltersAndFields } from "$lib/utils/parseUrlParams";
import { cacheControl } from "$lib/utils/cacheControl";

export const GET: RequestHandler = async ({ url, setHeaders }) => {
    const { filters, fields } = parseFiltersAndFields<Vehicle.Type>(url);
    const types = await findVehicleType(filters, fields);
    cacheControl(setHeaders);
    return json({ success: true, types })
};