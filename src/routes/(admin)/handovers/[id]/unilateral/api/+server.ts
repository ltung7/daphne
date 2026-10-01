import { error, json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import generateHandoverUnilateralDocument from "$lib/documents/handover-unilateral.documents";
import makeResponse from "$lib/utils/makePdfBufferResponse";
import { createVehicleHandover, setVehicleHandovers } from "$lib/server/db/firebase/vehicleHandovers.fdb";
import { unilateralReturnVehicleAndCloseHandover } from "$lib/server/services/vehicleStatus.service";

export const POST: RequestHandler = async ({ request, locals }) => {
	const data = await request.json();
	const variables = data.handover as DocumentGenerator.HandoverDocumentRecord;
	let id: string | undefined = data.id;

	if (id) {
		await setVehicleHandovers(id, variables);
	} else {
		const newData: Omit<DocumentGenerator.HandoverDocumentRecord, 'id'> = {
			...variables,
			timestamp: Date.now(),
			type: 'unilateral',
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
			const buffer = await generateHandoverUnilateralDocument(variables);
			const name = `Protokół jednostronnego odbioru pojazdu ${variables.registrationNumber}`;
			await setVehicleHandovers(id, { printed: Date.now() });
			return makeResponse(buffer, name);
		}
		case 'close': {
			const result = await unilateralReturnVehicleAndCloseHandover({
				registrationNumber: variables.registrationNumber,
				driverId: variables.driverId,
				handoverId: id,
				user: locals._user ?? undefined
			});
			if (!result.success) {
				throw error(500, result.error || 'Failed to close unilateral return handover');
			}
			break;
		}
	}

	return json({ success: true, action: data.action, id });
};
