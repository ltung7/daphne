import type { RequestHandler } from "./$types";
import { updateNotification } from "$lib/server/db/firebase/userNotifications.fdb";
import { json, error } from "@sveltejs/kit";

const ALLOWED_UPDATE_FIELDS = [
	'read'
] as const;

type AllowedUpdateField = typeof ALLOWED_UPDATE_FIELDS[number];

export const PATCH: RequestHandler = async ({ params, request, locals }) => {
	// Add auth checks if necessary
	const uid = locals.sessionClaims?.uid;
	if (!uid) {
		return error(401, 'Unauthorized');
	}

	const { data } = await request.json();
	
	const filteredData: Partial<Record<AllowedUpdateField, unknown>> = {};
	
	for (const key of ALLOWED_UPDATE_FIELDS) {
		if (key in data) {
			filteredData[key] = data[key];
		}
	}
	
	if (Object.keys(filteredData).length === 0) {
		return error(400, { message: 'No valid fields provided for update' });
	}
	
	await updateNotification(params.id, filteredData as Parameters<typeof updateNotification>[1]);
	
	return json({ success: true, updatedFields: Object.keys(filteredData) });
};
