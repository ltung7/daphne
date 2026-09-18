import {
	getItemById,
	getItems,
	queryItems,
	getLatest,
	countItems,
	countQueryItems,
	setItem,
	batchOperations,
	getRef,
} from './firebase';

type BalanceEvent = DriverBalance.BalanceEvent;
type BalanceEventType = DriverBalance.BalanceEventType;
type BalanceEventStatus = DriverBalance.BalanceEventStatus;

const collectionName = 'driverBalanceEvents';

export const setBalanceEvent = async (id: string, data: Partial<BalanceEvent>) => {
	return setItem(id, data, collectionName, false);
};

export const getBalanceEvent = async <T = BalanceEvent>(id: string): Promise<T | null> => {
	return getItemById(id, collectionName);
};

export const getBalanceEvents = async <T = BalanceEvent>(
	query: App.FirebaseItemsQuery<keyof BalanceEvent> = false,
	select: App.FirebaseItemsFields = false,
	order: App.FirebaseOrderQuery = false,
	limit: number | false = false
): Promise<T[]> => {
	return queryItems(collectionName, query as any, select, order, limit);
};

export const getBalanceEventsByDriver = async <T = BalanceEvent>(
	driverId: string,
	opts?: {
		from?: number;
		to?: number;
		limit?: number;
		offset?: number;
		status?: BalanceEventStatus;
	}
): Promise<T[]> => {
	const queries: App.FirebaseQueryList = [
		['driverId', '==', driverId],
	];

	if (opts?.status) {
		queries.push(['status', '==', opts.status]);
	}

	if (opts?.from) {
		queries.push(['timestamp', '>=', opts.from]);
	}

	if (opts?.to) {
		queries.push(['timestamp', '<=', opts.to]);
	}

	let order: App.FirebaseOrderQuery = ['timestamp', 'desc'];
	const limit = opts?.limit ?? 50;

	return queryItems(collectionName, queries, false, order, limit);
};

export const getLatestBalanceEvent = async <T = BalanceEvent>(
	driverId: string
): Promise<T | null> => {
	return getLatest(collectionName, false, { driverId }, 'timestamp');
};

export const getCurrentBalance = async (driverId: string): Promise<number> => {
	const event = await getLatestBalanceEvent(driverId);
	return event?.runningBalance ?? 0;
};

export const countBalanceEvents = async (
	driverId: string,
	status?: BalanceEventStatus
): Promise<number> => {
	const queries: App.FirebaseQueryList = [['driverId', '==', driverId]];
	if (status) queries.push(['status', '==', status]);
	return countQueryItems(collectionName, queries);
};

export const createBalanceEventsBatch = async (
	events: Partial<BalanceEvent>[]
) => {
	return batchOperations(collectionName, events, 'set');
};

export const eventExists = async (id: string): Promise<boolean> => {
	const docRef = await getRef(collectionName).doc(id).get();
	return docRef.exists;
};