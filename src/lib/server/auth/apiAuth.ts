// import { CHECK_AUTH } from './types.js';
// import { restrictAdmin } from './adminAuth.js';
// import { restrictDriver } from './driverAuth.js';

// export function requireDriverApi(locals: App.Locals): App.UserBase {
// 	if (!CHECK_AUTH) return locals.driver;
// 	return restrictDriver(locals);
// }

// export function requireAdminApi(locals: App.Locals, allowedRoles?: App.AdminRole[]): App.User {
// 	if (!CHECK_AUTH) return locals.user;
// 	const user = restrictAdmin(locals);
// 	if (allowedRoles && !allowedRoles.includes(user.role as App.AdminRole)) {
// 		throw new Error(`Required role: ${allowedRoles.join(' | ')}, current: ${user.role}`);
// 	}
// 	return user;
// }

// export function requireAnyApi(locals: App.Locals): { user: App.User | App.UserBase; userType: 'driver' | 'admin' } {
// 	if (!CHECK_AUTH) {
// 		return locals.userType === 'driver' 
// 			? { user: locals.driver, userType: 'driver' }
// 			: { user: locals.user, userType: 'admin' };
// 	}
// 	if (locals.userType === 'driver') {
// 		return { user: restrictDriver(locals), userType: 'driver' };
// 	}
// 	if (locals.userType === 'admin') {
// 		return { user: restrictAdmin(locals), userType: 'admin' };
// 	}
// 	throw new Error('Authentication required');
// }

// export function requirePublicApi(locals: App.Locals): void {
// 	if (!CHECK_AUTH) return;
// }