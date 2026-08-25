import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { deleteVehicleHandover, findVehicleHandovers, getVehicleHandovers } from "$lib/server/db/firebase/vehicleHandovers.fdb";
import { error } from "console";

export const GET: RequestHandler = async ({ url, setHeaders }) => {
    let fields: (keyof Vehicle.Vehicle)[] | false = false;
    if (url.searchParams.get('fields')) {
        fields = url.searchParams.get('fields')!.split(',') as (keyof Vehicle.Vehicle)[];
    }
    const handovers = await findVehicleHandovers(false, fields);
    setHeaders({
        "cache-control": "max-age=300"
    });
    return json({ success: true, handovers })
};

export const DELETE: RequestHandler = async ({ url }) => {
    const id = url.searchParams.get('id');
    if (!id) throw error(400, 'Brakuje ID');
    const handover = await getVehicleHandovers(id);
    if (!handover) throw error(404, 'Dokument nie został odnaleziony');
    if (handover.closed) throw error(400, 'Dokument został już zamknięty - nie można go usunąć');
    if (handover.docusignId) throw error(400, 'Dokument został wysłany do DocuSign - nie można go usunąć');
    await deleteVehicleHandover(id);
    return json({  success: true })
}
