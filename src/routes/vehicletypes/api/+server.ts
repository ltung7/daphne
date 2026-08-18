import { findVehicleType } from "$lib/server/db/firebase/vehicleType.fdb";
import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";

export const GET: RequestHandler = async ({ url }) => {
    let fields: (keyof Vehicle.Type)[] | false = false;
    if (url.searchParams.get('fields')) {
        fields = url.searchParams.get('fields')!.split(',') as (keyof Vehicle.Type)[];
    }
    const types = await findVehicleType(false, fields);
    return json({ success: true, types })
};