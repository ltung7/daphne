import { setVehicleType } from "$lib/server/db/firebase/vehicleType.fdb";
import { getVehicleTypeFromQuery } from "$lib/server/services/ai/openRouterVehicleType";
import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";

export const GET: RequestHandler = async ({ url, setHeaders }) => {
    const query = url.searchParams.get('query');
    if (!query) {
        return json({ success: false, error: 'Missing query parameter' }, { status: 400 });
    }
    const result = await getVehicleTypeFromQuery(query);
    if (!result) {
        return json({ success: false, error: 'Failed to generate vehicle type' }, { status: 500 });
    }
    setHeaders({
        "cache-control": "max-age=3600"
    });
    return json({ success: true, data: result });
};

export const POST: RequestHandler = async ({ request }) => {
    const { data } = await request.json();
    const id = data?.id || (Date.now() - 1780000000000).toString(36)
    delete data.id;
    await setVehicleType(id, data);
    return json({ success: true, id })
};