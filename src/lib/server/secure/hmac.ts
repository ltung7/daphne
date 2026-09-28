import { env } from '$env/dynamic/private';
import { createHmac, timingSafeEqual } from 'crypto';

const MASTER_SECRET = env.AC_SECRET;

export function generateJobToken(jobName: string): string {
	if (!MASTER_SECRET) throw new Error('AC_SECRET not configured');
	return createHmac('sha256', MASTER_SECRET).update(jobName).digest('hex').substring(0, 16);
}

export function verifyJobToken(jobName: string, provided: string): boolean {
	if (!MASTER_SECRET) throw new Error('AC_SECRET not configured');
	const expected = generateJobToken(jobName);
	return timingSafeEqual(Buffer.from(expected), Buffer.from(provided));
}