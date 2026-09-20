import { round } from '$lib/utils/round';
import {
	setBalanceEvent,
	getBalanceEvent,
	getBalanceEventsByDriver,
	getLatestBalanceEvent,
	getCurrentBalance as getCurrentBalanceDb,
	eventExists,
} from './driverBalanceEvents.fdb';

export async function recordEvent(params: {
	driverId: string;
	type: DriverBalance.BalanceEventType;
	amount: number;
	idempotencyKey: string;
	referenceId?: string;
	referenceType?: DriverBalance.BalanceEvent['referenceType'];
	metadata?: Record<string, any>;
	createdBy: string;
	createdByName: string;
	status?: DriverBalance.BalanceEventStatus;
}): Promise<DriverBalance.BalanceEvent> {
	const { driverId, type, amount, idempotencyKey, referenceId, referenceType, metadata, createdBy, createdByName, status = 'confirmed' } = params;

	const exists = await eventExists(idempotencyKey);
	if (exists) {
		const existing = await getBalanceEvent(idempotencyKey);
		if (existing) return existing as DriverBalance.BalanceEvent;
		throw new Error(`Event with idempotency key ${idempotencyKey} already exists`);
	}

	const lastEvent = await getLatestBalanceEvent(driverId);
	const lastBalance = lastEvent?.runningBalance ?? 0;
	const newRunningBalance = round(lastBalance + amount);

	const eventData: Partial<DriverBalance.BalanceEvent> = {
		id: idempotencyKey,
		driverId,
		type,
		status,
		amount: round(amount),
		runningBalance: newRunningBalance,
		referenceId,
		referenceType,
		metadata: metadata ?? {},
		timestamp: Date.now(),
		createdBy,
		createdByName,
	};

	await setBalanceEvent(idempotencyKey, eventData);

	return eventData as DriverBalance.BalanceEvent;
}

export async function getCurrentBalance(driverId: string): Promise<number> {
	return getCurrentBalanceDb(driverId);
}

export async function getBalanceHistory(
	driverId: string,
	opts?: {
		from?: number;
		to?: number;
		limit?: number;
		offset?: number;
		status?: DriverBalance.BalanceEventStatus;
	}
): Promise<DriverBalance.BalanceEvent[]> {
	return getBalanceEventsByDriver(driverId, opts);
}

export async function verifyBalance(driverId: string): Promise<{
	calculated: number;
	stored: number;
	mismatchedEvents: Array<{ eventId: string; expected: number; stored: number }>;
}> {
	const events = await getBalanceEventsByDriver(driverId, { limit: 10000 });
	const sortedEvents = events.sort((a, b) => a.timestamp - b.timestamp);

	let calculated = 0;
	const mismatched: Array<{ eventId: string; expected: number; stored: number }> = [];

	for (const e of sortedEvents) {
		calculated = round(calculated + e.amount);
		if (calculated !== e.runningBalance) {
			mismatched.push({ eventId: e.id, expected: calculated, stored: e.runningBalance });
		}
	}

	return {
		calculated,
		stored: sortedEvents[sortedEvents.length - 1]?.runningBalance ?? 0,
		mismatchedEvents: mismatched,
	};
}

export async function createReversalEvent(params: {
	originalEventId: string;
	driverId: string;
	reversalReason: string;
	createdBy: string;
	createdByName: string;
}): Promise<DriverBalance.BalanceEvent> {
	const original = await getBalanceEvent(params.originalEventId);
	if (!original) throw new Error(`Original event ${params.originalEventId} not found`);

	const reversalType = original.type;
	const reversalAmount = -original.amount;
	const idempotencyKey = `rev:${params.originalEventId}`;

	return recordEvent({
		driverId: params.driverId,
		type: reversalType,
		amount: reversalAmount,
		idempotencyKey,
		referenceId: original.id,
		referenceType: original.referenceType,
		metadata: {
			reversalOf: original.id,
			reversalReason: params.reversalReason,
			originalAmount: original.amount,
			originalRunningBalance: original.runningBalance,
		},
		createdBy: params.createdBy,
		createdByName: params.createdByName,
	});
}