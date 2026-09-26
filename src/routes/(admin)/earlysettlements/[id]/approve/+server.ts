import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { approveEarlySettlement } from '$lib/server/services/earlySettlements.service';
import { restrictAdmin } from '$lib/server/auth';

export const POST: RequestHandler = async ({ params, locals }) => {
	restrictAdmin(locals);
	
	const user = locals._user;
	if (!user) {
		return json({ success: false, message: 'Brak uprawnień' }, { status: 401 });
	}

	try {
		await approveEarlySettlement(params.id, user.id, user.name);
		return json({ success: true });
	} catch (e: any) {
		return json({ success: false, message: e.message || 'Wystąpił błąd' }, { status: 400 });
	}
};