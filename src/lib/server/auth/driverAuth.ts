import type { UserBase } from './types.js';

export function restrictDriver(locals: App.Locals): UserBase {
	if (!locals._driver || locals._userType !== 'driver') {
		throw new Error('Driver access required');
	}
	return locals._driver;
}

export function checkDriverAccess(locals: App.Locals, targetDriverId: string): void {
	const driver = restrictDriver(locals);
	if (driver.id !== targetDriverId) {
		throw new Error('Access denied: can only access own data');
	}
}

export function isDriver(locals: App.Locals): boolean {
	return locals._userType === 'driver' && !!locals._driver;
}

export function getDriverId(locals: App.Locals): string | null {
	if (!locals._driver || locals._userType !== 'driver') return null;
	return locals._driver.id;
}