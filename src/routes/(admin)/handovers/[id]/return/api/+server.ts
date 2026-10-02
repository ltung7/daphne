import { error, json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import generateHandoverReturnDocument from "$lib/documents/handover-return.document";
import makeResponse from "$lib/utils/makePdfBufferResponse";
import { createVehicleHandover, setVehicleHandovers } from "$lib/server/db/firebase/vehicleHandovers.fdb";
import { returnVehicleAndCloseHandover } from "$lib/server/services/vehicleStatus.service";

export const POST: RequestHandler = async ({ request, locals }) => {
	const data = await request.json();
	const variables = data.handover as DocumentGenerator.HandoverDocument;
	let id: string | undefined = data.id;

	if (id) {
		await setVehicleHandovers(id, variables);
	} else {
		const newData: Omit<DocumentGenerator.HandoverDocumentRecord, 'id'> = {
			...variables,
			timestamp: Date.now(),
			type: 'return',
			closed: false,
			manualClose: false
		};
		id = await createVehicleHandover(newData);
	}

	if (!id) {
		throw error(500, 'Failed to save handover');
	}

	switch (data.action) {
		case 'pdf': {
			const buffer = await generateHandoverReturnDocument(variables, variables.locale);
			const name = `Protokół zwrotu pojazdu ${variables.registrationNumber} ${variables.driverName}`;
			await setVehicleHandovers(id, { printed: Date.now() });
			return makeResponse(buffer, name);
		}
		case 'close': {
			const result = await returnVehicleAndCloseHandover({
				registrationNumber: variables.registrationNumber,
				driverId: variables.driverId,
				handoverId: id,
				approver: {
					id: locals._user!.id,
					name: locals._user!.name
				}
			});
			if (!result.success) {
				throw error(500, result.error || 'Failed to close return handover');
			}
			break;
		}
	}

	return json({ success: true, action: data.action, id });
};
