import { getDriver } from '$lib/server/db/firebase/drivers.fdb';
import { getVehicle } from '$lib/server/db/firebase/vehicles.fdb';
import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const user = locals.driver;
	if (!user) throw error(404, 'Not found')
	const driver = await getDriver(user.id);
	if (!driver) throw error(404, 'Not found')
	
	let vehicle = null;
	if (driver.assignedVehicle && typeof driver.assignedVehicle === 'object' && driver.assignedVehicle.registrationNumber) {
		vehicle = await getVehicle(driver.assignedVehicle.registrationNumber);
	}
	
	return { driver, vehicle };
};