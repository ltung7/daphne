import type * as Kit from '@sveltejs/kit';

interface AuthCookieUser extends App.BaseUserData {
    exp?: number;
}

type CookiePayload = AuthCookieUser & {
    exp: number;
    iat: number;
}

import jwt from 'jsonwebtoken';
import { env } from '$env/dynamic/private';
import { error } from '@sveltejs/kit';
import { logger } from '$lib/utils/logger';

function getTimestampInSeconds (add = DEFAULT_TIMEOUT) {
    return Math.floor(Date.now() / 1000 + add)
}

const AUTH_COOKIE_NAME = 'portal.ls.auth';
const DEFAULT_TIMEOUT = 86400;
const SECURE = (env.NODE_ENV !== 'development')
const ALL_ROLES: App.UserRoles[] = [ 'admin', 'streamer', 'superadmin' ]

export const rolePaths: Map<string, App.UserRoles[]> = new Map([
    [ '(superadmin)', [ 'superadmin' ] ],
    [ '(admin)', [ 'superadmin', 'admin' ] ],
    [ '(app)', [ 'superadmin', 'admin' ] ],
    [ '(account)', ALL_ROLES ],
]);

export const loginSelectedUser = async (cookies: Kit.Cookies, user: App.User, timeout = DEFAULT_TIMEOUT) => {
    const authUser: AuthCookieUser = {
        user: user.login,
        role: user.role,
        accounts: user.accounts,
    }
    authUser.exp = getTimestampInSeconds(timeout);
    const signed = jwt.sign(authUser, env.AC_SECRET);
    await setAuthCookie(cookies, signed, timeout);
    return authUser;
}

export const getAuthCookie = async (cookies: Kit.Cookies) => {
    const cookie = cookies.get(AUTH_COOKIE_NAME);
    if (!cookie) throw new Error('No auth data');
    return jwt.verify(cookie, env.AC_SECRET) as CookiePayload;
}

export const checkRole = async (roles: string[], cookies: Kit.Cookies, account: string|undefined) => {
    const payload: CookiePayload = await getAuthCookie(cookies);
    if (!roles.includes(payload.role)) throw new Error('Role not allowed');
    if (account && !payload.accounts.includes(account) && payload.role !== 'superadmin') {
        throw new Error('Invalid account');
    }
    if ((payload.exp - Date.now() / 1000) < 7200) {
        payload.exp = getTimestampInSeconds(DEFAULT_TIMEOUT);
        const signed = jwt.sign(payload, env.AC_SECRET);
        await setAuthCookie(cookies, signed);
    }
    return payload;
}

export const setAuthCookie = async (cookies: Kit.Cookies, data: string, maxAge = DEFAULT_TIMEOUT, name = AUTH_COOKIE_NAME) => {
    const params: import('cookie').CookieSerializeOptions & { path: string } = { path: '/', httpOnly: true, sameSite: 'lax', secure: SECURE, maxAge };
    cookies.set(name, data, params);
}

export const updateAuthCookie = async (cookies: Kit.Cookies, updateData: Record<string, any>, name = AUTH_COOKIE_NAME) => {
    const cookie = cookies.get(name);
    if (!cookie) return;
    const payload = jwt.verify(cookie, env.AC_SECRET) as CookiePayload;
    Object.assign(payload, updateData);
    const signed = jwt.sign(payload, env.AC_SECRET);
    const timeout = Math.round(payload.exp - Date.now() / 1000);
    setAuthCookie(cookies, signed, timeout);
    return payload;
}

type HandleParams = Parameters<Kit.Handle>[0];

export const handleRoleCheck: Kit.Handle = async ({ event, resolve }: HandleParams) => {
    if (!event.route.id || event.locals.auth) return resolve(event);
    const lastSlash = event.route.id.indexOf('/', 1);
    const primaryGroup = event.route.id.slice(1, lastSlash);
    const roles = rolePaths.get(primaryGroup);
    if (roles) {
        try {
            const authData = await checkRole(roles, event.cookies, event.params.account);
            event.locals.auth = { role: authData.role, user: authData.user, accounts: authData.accounts };
        } catch (err: unknown) {
            logger.error(err);
            let Location = ''
            const goto = event.url.pathname;
            Location += '/login?k=pr&s=401&goto=' + goto;
            return new Response('Redirect', { status: 302, headers: { Location } });
        }
    }
    return resolve(event);
}

const restrictRole = (locals: App.Locals, roles: App.UserRoles[] = [ 'admin' ]) => {
    restrictAuthentication(locals);
    if (locals.auth.role === 'superadmin') return locals.admin = true;
    if (!roles.includes(locals.auth.role)) error (403, 'Unauthorized');
}

const restrictAuthentication = (locals: App.Locals) => {
    if (!locals || !locals.auth || !locals.auth.role || locals.auth.role === 'revoked') error(401, 'Unauthenticated');
}

export const restrictGlobalAdmin = (locals: App.Locals) => {
    restrictAuthentication(locals);
    if (locals.auth.role !== 'superadmin') error(403, 'Unauthorized');
}

export const restrictAccountAdmin = (locals: App.Locals) => {
    restrictRole(locals)
}