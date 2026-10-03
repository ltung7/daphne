import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { getUserNotifications, getUnreadCount } from "$lib/server/db/firebase/userNotifications.fdb";
import { cacheControl } from "$lib/utils/cacheControl";

export const GET: RequestHandler = async ({ url, setHeaders, locals }) => {
	const uid = locals.sessionClaims?.uid;
	if (!uid) {
		return json({ success: false, error: 'Unauthorized' }, { status: 401 });
	}

	if (url.searchParams.has('count')) {
		const count = await getUnreadCount(uid);
		cacheControl(setHeaders);
		return json({ success: true, count });
	}

	const items = await getUserNotifications(uid);
	cacheControl(setHeaders);
	return json({ success: true, items })
};
