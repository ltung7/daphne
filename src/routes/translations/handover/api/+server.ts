import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { setVehicleHandoverTranslation } from "$lib/server/db/firebase/vehicleHandoverTranslation.fdb";

export const PATCH: RequestHandler = async ({ request }) => {
    const { language, translation } = await request.json();
    await setVehicleHandoverTranslation(language, translation)
    return json({ success: true })
};