import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { findVehicleInspections } from "$lib/server/db/firebase/vehicleInspections.fdb";
import { isDev } from "$lib/utils/isDev";

export const GET: RequestHandler = async ({ url, setHeaders }) => {
    let fields: (keyof DocumentGenerator.InspectionDocumentRecord)[] | false = false;
    if (url.searchParams.get('fields')) {
        fields = url.searchParams.get('fields')!.split(',') as (keyof DocumentGenerator.InspectionDocumentRecord)[];
    }
    const inspections = await findVehicleInspections(false, fields);
    if (isDev) {
        setHeaders({
            "cache-control": "max-age=60000"
        });
    } else {
        setHeaders({
            "cache-control": "max-age=300"
        });
    }
    return json({ success: true, inspections })
};