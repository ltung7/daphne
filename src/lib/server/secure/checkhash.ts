import chash from '$lib/server/secure/chash';
import { error } from '@sveltejs/kit';
import { createHash } from 'crypto'

export default (params: { task: string, hash: string }, url: URL) => {
    if (url.hostname === 'localhost') return true;
    const dateBase = Math.round(Date.now() / 86400000);
    let base = 'tt' + dateBase;
    if (params.task) base += params.task;
    const hash = chash(base, true, 16);
    if (hash !== params.hash) error(403, { message: 'Invalid hash' }); 

}

export const generateCronHash = (task: string) => {
    return createHash('md5').update('xTask_' + task).digest('base64url').substring(4,12);
}