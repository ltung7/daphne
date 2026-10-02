import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { findVehicleInspections } from "$lib/server/db/firebase/vehicleInspections.fdb";
import { parseFiltersAndFields } from "$lib/utils/parseUrlParams";
import { cacheControl } from "$lib/utils/cacheControl";

export const GET: RequestHandler = async ({ url, setHeaders }) => {
    const { filters, fields } = parseFiltersAndFields<DocumentGenerator.InspectionDocumentRecord>(url);
    const inspections = await findVehicleInspections(filters, fields);
    cacheControl(setHeaders);
    return json({ success: true, inspections })
};