import { validateDriverRequirements } from "$lib/assets/requirements";
import { getDriver, updateDriver } from "$lib/server/db/firebase/drivers.fdb";
import type { RequestHandler } from "./$types";
import { error, json } from "@sveltejs/kit";

export const PATCH: RequestHandler = async ({ params, request }) => {
    const body = await request.json();

    const driver = await getDriver(params.id);
    if (!driver) throw error(404);

    if (body.status === 'available' && driver.status === 'pending_verification') {
        if (!body.verificationResult) throw error(400, 'Missing verification data');
        const verified = validateDriverRequirements(body.verificationResult);
        if (!verified) throw error(400, 'Invalid verification');

        await updateDriver(driver.id, { status: 'available' })
        return json({ success: true, status: 'available' })
    }
    

    throw error(400, 'Invalid status');
};