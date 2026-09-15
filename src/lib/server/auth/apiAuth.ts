// import { CHECK_AUTH } from '$lib/nav/stores.svelte.js';
// import { restrictAdmin } from './adminAuth.js';
// import { restrictDriver } from './driverAuth.js';

// export function requireDriverApi(locals: App.Locals): App.UserBase {
// 	if (!CHECK_AUTH) return locals._driver;
// 	return restrictDriver(locals);
// }

// export function requireAdminApi(locals: App.Locals, allowedRoles?: App.AdminRole[]): App.User {
// 	if (!CHECK_AUTH) return locals._user;
// 	const user = restrictAdmin(locals);
// 	if (allowedRoles && !allowedRoles.includes(user.role as App.AdminRole)) {
// 		throw new Error(`Required role: ${allowedRoles.join(' | ')}, current: ${user.role}`);
// 	}
// 	return user;
// }

// export function requireAnyApi(locals: App.Locals): { user: App.User | App.UserBase; userType: 'driver' | 'admin' } {
// 	if (!CHECK_AUTH) {
// 		return locals._userType === 'driver' 
// 			? { user: locals._driver, userType: 'driver' }
// 			: { user: locals._user, userType: 'admin' };
// 	}
// 	if (locals._userType === 'driver') {
// 		return { user: restrictDriver(locals), userType: 'driver' };
// 	}
// 	if (locals._userType === 'admin') {
// 		return { user: restrictAdmin(locals), userType: 'admin' };
// 	}
// 	throw new Error('Authentication required');
// }

// export function requirePublicApi(locals: App.Locals): void {
// 	if (!CHECK_AUTH) return;
// }