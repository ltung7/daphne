import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { addNewDriver } from "$lib/server/db/firebase/drivers.fdb";

export const POST: RequestHandler = async ({ request }) => {
    const { data } = await request.json();
    const { id, password } = await addNewDriver(data);
    return json({ success: true, id, password })
};