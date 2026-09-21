import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { findEarlySettlements } from "$lib/server/db/firebase/earlySettlements.fdb";

export const GET: RequestHandler = async ({ url, setHeaders }) => {
    let fields: (keyof DriverBalance.EarlySettlement)[] | false = false;
    if (url.searchParams.get('fields')) {
        fields = url.searchParams.get('fields')!.split(',') as (keyof DriverBalance.EarlySettlement)[];
    }
    const earlySettlements = await findEarlySettlements(false, fields);
    
    // Sort by createdAt descending
    earlySettlements.sort((a, b) => b.createdAt - a.createdAt);

    setHeaders({
        "cache-control": "max-age=300"
    });
    return json({ success: true, earlySettlements })
};