import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { rejectEarlySettlement } from '$lib/server/services/earlySettlements.service';
import { restrictAdmin } from '$lib/server/auth';

export const POST: RequestHandler = async ({ params, request, locals }) => {
	restrictAdmin(locals);
	
	const user = locals._user;
	if (!user) {
		return json({ success: false, message: 'Brak uprawnień' }, { status: 401 });
	}

	const body = await request.json();
	const { reason } = body;

	if (!reason || !reason.trim()) {
		return json({ success: false, message: 'Powód odrzucenia jest wymagany' }, { status: 400 });
	}

	try {
		await rejectEarlySettlement(params.id, reason, user.id, user.name);
		return json({ success: true });
	} catch (e: any) {
		return json({ success: false, message: e.message || 'Wystąpił błąd' }, { status: 400 });
	}
};