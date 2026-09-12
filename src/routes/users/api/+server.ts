import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { findUsers } from "$lib/server/db/firebase/users.fdb";
import { isDev } from "$lib/utils/isDev";

export const GET: RequestHandler = async ({ url, setHeaders }) => {
    let fields: (keyof App.User)[] | false = false;
    if (url.searchParams.get('fields')) {
        fields = url.searchParams.get('fields')!.split(',') as (keyof App.User)[];
    }
    const users = await findUsers<App.User>(false, fields);
    if (isDev) {
        setHeaders({
            "cache-control": "max-age=60000"
        });
    } else {
        setHeaders({
            "cache-control": "max-age=300"
        });
    }
    return json({ success: true, users })
};