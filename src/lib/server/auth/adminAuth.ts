export function restrictAdmin(locals: App.Locals): App.User {
	if (!locals.user || locals.userType !== 'admin') {
		throw new Error('Admin access required');
	}
	return locals.user;
}

export function requireRole(locals: App.Locals, roles: App.AdminRole[]): void {
	const user = restrictAdmin(locals);
	if (!roles.includes(user.role as App.AdminRole)) {
		throw new Error(`Required role: ${roles.join(' | ')}, current: ${user.role}`);
	}
}

export function requireAdmin(locals: App.Locals): void {
	requireRole(locals, [ 'admin' ]);
}

export function requireManager(locals: App.Locals): void {
	requireRole(locals, [ 'manager', 'admin' ]);
}

export function requireModerator(locals: App.Locals): void {
	requireRole(locals, [ 'moderator', 'manager', 'admin' ]);
}

export function isAdmin(locals: App.Locals): boolean {
	return locals.userType === 'admin' && !!locals.user;
}

export function isManagerOrAbove(locals: App.Locals): boolean {
	if (!locals.user || locals.userType !== 'admin') return false;
	return locals.user.role === 'manager' || locals.user.role === 'admin';
}

export function isModeratorOrAbove(locals: App.Locals): boolean {
	if (!locals.user || locals.userType !== 'admin') return false;
	return locals.user.role === 'moderator' || locals.user.role === 'manager' || locals.user.role === 'admin';
}