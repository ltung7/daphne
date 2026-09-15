import { sequence } from '@sveltejs/kit/hooks';
import { authMiddleware } from '$lib/server/auth/auth.middleware';
import type { Handle } from '@sveltejs/kit';
import { getTextDirection } from '$lib/paraglide/runtime';
import { paraglideMiddleware } from '$lib/paraglide/server.js';

const handleApiHeader: Handle = async ({ event, resolve }) => {
    if (event.url.pathname.startsWith('/api/') || event.url.pathname.startsWith('/webhook/')) {
        event.request.headers.set('accept', 'application/json');
    }
    return resolve(event);
}

const handleBlanks: Handle = async ({ event, resolve }) => {
    if (event.url.pathname.startsWith('/.well-known/appspecific/com.chrome.devtools') ||
        event.url.pathname.startsWith('/_ah') ||
        event.url.pathname.startsWith('/.') ||
        event.url.pathname.endsWith('.php')
    )
    return new Response(null, { status: 204 });
    return await resolve(event);
};


const handleParaglide: Handle = ({ event, resolve }) =>
    paraglideMiddleware(event.request, ({ request, locale }) => {
        event.request = request;

        const isAdminRoute = event.route.id?.startsWith('/(admin)');
        const forcedLocale = isAdminRoute ? 'pl' : locale;
        
        event.locals.locale = forcedLocale;
        return resolve(event, {
            transformPageChunk: ({ html }) => html.replace('%paraglide.lang%', forcedLocale).replace('%paraglide.dir%', getTextDirection(forcedLocale))
        });
    });

export const handle = sequence(
	handleBlanks,
	handleApiHeader,
	authMiddleware,
    handleParaglide,
);