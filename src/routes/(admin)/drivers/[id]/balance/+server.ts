import { restrictAdmin } from "$lib/server/auth";
import { getBalanceEventsByDriver } from "$lib/server/db/firebase/driverBalanceEvents.fdb";
import type { RequestHandler } from "./$types";
import { json } from "@sveltejs/kit";

export const GET: RequestHandler = async ({ params, url, locals }) => {
    restrictAdmin(locals);
    
    const driverId = params.id;
    const offset = Number(url.searchParams.get('offset')) || 0;
    const limit = Number(url.searchParams.get('limit')) || 20;
    
    const events = await getBalanceEventsByDriver(driverId, { limit, offset });
    
    return json(events);
};