export function restrictAdmin(locals: App.Locals): App.User {
	if (!locals._user || locals._userType !== 'admin') {
		throw new Error('Admin access required');
	}
	return locals._user;
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
	return locals._userType === 'admin' && !!locals._user;
}

export function isManagerOrAbove(locals: App.Locals): boolean {
	if (!locals._user || locals._userType !== 'admin') return false;
	return locals._user.role === 'manager' || locals._user.role === 'admin';
}

export function isModeratorOrAbove(locals: App.Locals): boolean {
	if (!locals._user || locals._userType !== 'admin') return false;
	return locals._user.role === 'moderator' || locals._user.role === 'manager' || locals._user.role === 'admin';
}