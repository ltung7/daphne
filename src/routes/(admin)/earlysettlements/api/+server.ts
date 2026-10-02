import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { findEarlySettlements } from "$lib/server/db/firebase/earlySettlements.fdb";
import { parseFiltersAndFields } from "$lib/utils/parseUrlParams";
import { cacheControl } from "$lib/utils/cacheControl";

export const GET: RequestHandler = async ({ url, setHeaders }) => {
    const { filters, fields } = parseFiltersAndFields<DriverBalance.EarlySettlement>(url);
    const earlySettlements = await findEarlySettlements(filters, fields);
    earlySettlements.sort((a, b) => b.createdAt - a.createdAt);
    cacheControl(setHeaders);
    return json({ success: true, earlySettlements })
};