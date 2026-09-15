import { CHECK_AUTH } from './types.js';
import { restrictAdmin } from './adminAuth.js';
import { restrictDriver } from './driverAuth.js';

export function requireAuth(locals: App.Locals): App.User | App.UserBase | null {
	if (!CHECK_AUTH) return locals._user || locals._driver;
	if (locals._userType === 'admin') return restrictAdmin(locals);
	if (locals._userType === 'driver') return restrictDriver(locals);
	throw new Error('Authentication required');
}