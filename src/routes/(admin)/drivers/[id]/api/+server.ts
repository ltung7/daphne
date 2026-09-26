import type { RequestHandler } from "./$types";
import { handleDriverPasswordResetEndpoint } from "$lib/server/services/users.service";
import { updateDriver } from "$lib/server/db/firebase/drivers.fdb";
import { json, error } from "@sveltejs/kit";

const ALLOWED_UPDATE_FIELDS = [
    'name',
    'phone',
    'email',
    'address',
    'drivingLicenses',
    'nationality',
    'identificationDocumentType',
    'identificationDocumentNumber',
    'taxiAuthorization',
    'polishLanguage',
    'additionalLanguages',
    'notes',
    'imageUrl',
    'preferredLanguage',
    'sex'
] as const;

type AllowedUpdateField = typeof ALLOWED_UPDATE_FIELDS[number];

export const POST: RequestHandler = async ({ params, request }) => {
    const body = await request.json();
    return handleDriverPasswordResetEndpoint(params.id, body.action)
};

export const PATCH: RequestHandler = async ({ params, request }) => {
    const body = await request.json();
    
    const filteredData: Partial<Record<AllowedUpdateField, unknown>> = {};
    
    for (const key of ALLOWED_UPDATE_FIELDS) {
        if (key in body) {
            filteredData[key] = body[key];
        }
    }
    
    if (Object.keys(filteredData).length === 0) {
        return error(400, { message: 'No valid fields provided for update' });
    }
    
    await updateDriver(params.id, filteredData as Parameters<typeof updateDriver>[1]);
    
    return json({ success: true, updatedFields: Object.keys(filteredData) });
};