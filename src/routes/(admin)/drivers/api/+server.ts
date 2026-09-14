import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { findDrivers } from "$lib/server/db/firebase/drivers.fdb"
import { isDev } from "$lib/utils/isDev";

export const GET: RequestHandler = async ({ url, setHeaders }) => {
    let fields: (keyof Vehicle.Vehicle)[] | false = false;
    if (url.searchParams.get('fields')) {
        fields = url.searchParams.get('fields')!.split(',') as (keyof Vehicle.Vehicle)[];
    }
    const vehicles = await findDrivers(false, fields);
    if (isDev) {
        setHeaders({
            "cache-control": "max-age=60000"
        });
    } else {
        setHeaders({
            "cache-control": "max-age=300"
        });
    }
    return json({ success: true, vehicles })
};