import { isDev } from './isDev';

export function cacheControl(
    setHeaders: (headers: Record<string, string>) => void,
    devMinutes = 60,
    prodMinutes = 5
): void {
    const maxAge = (isDev ? devMinutes : prodMinutes) * 60;
    setHeaders({
        "cache-control": `max-age=${maxAge}`
    });
}