import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { findDrivers } from "$lib/server/db/firebase/drivers.fdb"

export const GET: RequestHandler = async ({ url }) => {
    let fields: (keyof Vehicle.Vehicle)[] | false = false;
    if (url.searchParams.get('fields')) {
        fields = url.searchParams.get('fields')!.split(',') as (keyof Vehicle.Vehicle)[];
    }
    const vehicles = await findDrivers(false, fields);
    return json({ success: true, vehicles })
};