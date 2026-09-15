import { sequence } from '@sveltejs/kit/hooks';
import { authMiddleware } from '$lib/server/auth/auth.middleware';
import type { Handle } from '@sveltejs/kit';
import { DRIVER_COOKIE } from '$lib/server/auth/types.js';
import { isDev } from '$lib/utils/isDev';
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

const handleTestDriver: Handle = async ({ event, resolve }) => {
    const isDriverRoute = event.route.id?.startsWith('/(driver)');

    if (isDev && isDriverRoute) {
        const testDriverId = 'FVeAlaxqCJjmQO1gffx9';
        const testDriverEmail = 'Sofiya Nogachevska';
        const testDriverName = 'sofiyanogachevska109@mail.pl';

        const now = Math.floor(Date.now() / 1000);
        
        event.locals._userType = 'driver';
        event.locals._driver = {
            id: testDriverId,
            email: testDriverEmail,
            name: testDriverName,
            role: 'driver',
            preferredLanguage: 'pl',
            timestamp: now * 1000,
            updatedAt: now * 1000,
            lastLoggedIn: now * 1000
        };

        if (!event.cookies.get(DRIVER_COOKIE)) {
            event.cookies.set(DRIVER_COOKIE, 'test-session-cookie', {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                path: '/',
                maxAge: 60 * 60 * 2
            });
        }
    }

    return resolve(event);
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

// const handleParaglide: Handle = async ({ event, resolve }) => {
//     return paraglideMiddleware(event.request, ({ locale, request }) => {
//         // Store locale in locals for use in load functions
//         event.locals.locale = locale;
//         return resolve({ request });
//     });
// };

export const handle = sequence(
	handleBlanks,
	handleApiHeader,
	handleTestDriver,
	authMiddleware,
    handleParaglide,
	// async ({ event, resolve }) => {
	// 	return paraglideMiddleware(event.request, ({ request, locale }) => {
	// 		event.locals.locale = locale;
	// 		return resolve(request);
	// 	});
	// }
);