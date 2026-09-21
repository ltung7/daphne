import { createEarlySettlement } from "$lib/server/services/earlySettlements.service";
import type { RequestHandler } from "./$types";
import { json, error } from "@sveltejs/kit";

export const POST: RequestHandler = async ({ request, locals }) => {
    const user = locals._driver;

    if (!user?.id) {
        throw error(401, 'Unauthorized');
    }

    const body = await request.json();
    const { driverId, requestedAmount } = body;


    if (!driverId || typeof requestedAmount !== 'number' || driverId !== user.id) {
        throw error(400, 'Missing required fields: driverId, requestedAmount');
    }

    if (requestedAmount <= 0) {
        throw error(400, 'Requested amount must be positive');
    }

    try {
        const result = await createEarlySettlement({
            driverId,
            requestedAmount,
            createdBy: user.id,
            createdByName: user.name
        });

        return json({ earlySettlement: result.earlySettlement, success: true });
    } catch (e) {
        const message = e instanceof Error ? e.message : 'Failed to create early settlement';
        throw error(400, message);
    }
};