import { getDriver } from '$lib/server/db/firebase/drivers.fdb';
import { getVehicle } from '$lib/server/db/firebase/vehicles.fdb';
import { error, redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';
import { findVehicleDocuments } from '$lib/server/db/firebase/vehicleDocuments.fdb';
import { findDriverDocuments } from '$lib/server/db/firebase/driverDocuments.fdb';
import { getLatestBalanceEvent } from '$lib/server/db/firebase/driverBalanceEvents.fdb';

export const load: LayoutServerLoad = async ({ locals }) => {
	if (!locals._driver) {
		throw redirect(302, '/login?message=evil')
	}
	const user = locals._driver;
	const exp = locals.sessionClaims?.exp;
	
	if (!user) throw error(404, 'Not found')
	const driver = await getDriver(user.id);
	if (!driver) throw error(404, 'Not found')
	
	let vehicle = null, vehicleDocuments: Vehicle.VehicleDocument[] = [], documents: (Vehicle.VehicleDocument | Driver.DriverDocument)[] = [];
	if (driver.assignedVehicle && typeof driver.assignedVehicle === 'object' && driver.assignedVehicle.registrationNumber) {
		vehicle = await getVehicle(driver.assignedVehicle.registrationNumber);
		vehicleDocuments = await findVehicleDocuments({ registrationNumber: driver.assignedVehicle.registrationNumber })
		
	}
	const driverDocuments = await findDriverDocuments({ driverId: driver.id })
	documents = [ ...vehicleDocuments, ...driverDocuments ];
	const balance = await getLatestBalanceEvent(driver.id)
	
	return { driver, vehicle, documents, locale: locals.locale, exp, balance };
};