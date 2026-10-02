import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { processWeeklyIngestion } from "$lib/server/services/weeklyIngestation.service";

export const POST: RequestHandler = async ({ request, locals }) => {
	const { payload } = await request.json();
	const createdBy = locals.sessionClaims?.uid || 'system';
	const createdByName = locals._user?.name || 'System';

	const result = await processWeeklyIngestion({
		...payload,
		createdBy,
		createdByName
	});

	return json(result);
};