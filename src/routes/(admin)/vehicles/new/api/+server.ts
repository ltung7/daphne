import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { addNewVehicle } from "$lib/server/db/firebase/vehicles.fdb";

export const POST: RequestHandler = async ({ request }) => {
    const { data } = await request.json();
    const id = await addNewVehicle(data);
    return json({ success: true, id })
};