import { getSettingsGroup } from '$lib/server/db/firebase/settings.fdb';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const [ company, rideServices ] = await Promise.all([
		getSettingsGroup('company'),
		getSettingsGroup('rideServices')
	]);

	const provisionRate: number = company?.finances?.provisionRate ?? (company?.finances as any)?.companyRate ?? 0.50;
	const boltRate: number = rideServices?.bolt?.boltRate ?? 0.25;

	return {
		provisionRate,
		boltRate
	};
};
