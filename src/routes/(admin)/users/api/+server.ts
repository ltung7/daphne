import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { findUsers } from "$lib/server/db/firebase/users.fdb";
import { parseFiltersAndFields } from "$lib/utils/parseUrlParams";
import { cacheControl } from "$lib/utils/cacheControl";

export const GET: RequestHandler = async ({ url, setHeaders }) => {
    const { filters, fields } = parseFiltersAndFields<App.User>(url);
    const users = await findUsers(filters, fields);
    cacheControl(setHeaders);
    return json({ success: true, users })
};