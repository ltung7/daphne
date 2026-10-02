import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { findDrivers } from "$lib/server/db/firebase/drivers.fdb"
import { parseFiltersAndFields } from "$lib/utils/parseUrlParams";
import { cacheControl } from "$lib/utils/cacheControl";

export const GET: RequestHandler = async ({ url, setHeaders }) => {
    const { filters, fields } = parseFiltersAndFields<Vehicle.Vehicle>(url);
    const vehicles = await findDrivers(filters, fields);
    cacheControl(setHeaders);
    return json({ success: true, vehicles })
};