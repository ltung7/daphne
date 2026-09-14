import { getDriver } from '$lib/server/db/firebase/drivers.fdb';
import { getVehicle } from '$lib/server/db/firebase/vehicles.fdb';
import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { findVehicleDocuments } from '$lib/server/db/firebase/vehicleDocuments.fdb';
import { findDriverDocuments } from '$lib/server/db/firebase/driverDocuments.fdb';

export const load: PageServerLoad = async ({ locals }) => {
	const user = locals.driver;
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
	
	return { driver, vehicle, balance: 0, documents };
};