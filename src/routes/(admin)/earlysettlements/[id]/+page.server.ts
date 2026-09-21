import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { getEarlySettlement } from '$lib/server/db/firebase/earlySettlements.fdb';
import { getDriver } from '$lib/server/db/firebase/drivers.fdb';
import { getCurrentBalance } from '$lib/server/db/firebase/driverBalanceEvents.fdb';

export const load: PageServerLoad = async ({ params }) => {
	const earlySettlement = await getEarlySettlement(params.id);
	
	if (!earlySettlement) {
		throw error(404, 'Nie znaleziono wniosku');
	}

	const driver = await getDriver(earlySettlement.driverId);
	const currentBalance = await getCurrentBalance(earlySettlement.driverId);

	return {
		earlySettlement,
		driver,
		currentBalance
	};
};