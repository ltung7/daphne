import type { UserBase } from './types.js';

export function restrictDriver(locals: App.Locals): UserBase {
	if (!locals.driver || locals.userType !== 'driver') {
		throw new Error('Driver access required');
	}
	return locals.driver;
}

export function checkDriverAccess(locals: App.Locals, targetDriverId: string): void {
	const driver = restrictDriver(locals);
	if (driver.id !== targetDriverId) {
		throw new Error('Access denied: can only access own data');
	}
}

export function isDriver(locals: App.Locals): boolean {
	return locals.userType === 'driver' && !!locals.driver;
}

export function getDriverId(locals: App.Locals): string | null {
	if (!locals.driver || locals.userType !== 'driver') return null;
	return locals.driver.id;
}