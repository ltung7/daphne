import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { getUserNotifications } from "$lib/server/db/firebase/userNotifications.fdb";
import { isDev } from "$lib/utils/isDev";

export const GET: RequestHandler = async ({ url, setHeaders, locals }) => {
	const uid = locals.sessionClaims?.uid;
	if (!uid) {
		return json({ success: false, error: 'Unauthorized' }, { status: 401 });
	}

	const items = await getUserNotifications(uid);
	
	if (isDev) {
		setHeaders({ "cache-control": "max-age=60000" });
	} else {
		setHeaders({ "cache-control": "max-age=300" });
	}
	
	return json({ success: true, items })
};
