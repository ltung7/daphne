import {
	getItemById,
	queryItems,
	getLatest,
	countQueryItems,
	setItem,
	batchOperations,
	getRef,
} from './firebase';

const collectionName = 'driverBalanceEvents';

export const setBalanceEvent = async (id: string, data: Partial<DriverBalance.BalanceEvent>) => {
	return setItem(id, data, collectionName, false);
};

export const getBalanceEvent = async <T = DriverBalance.BalanceEvent>(id: string): Promise<T | null> => {
	return getItemById(id, collectionName);
};

export const getBalanceEvents = async <T = DriverBalance.BalanceEvent>(
	query: App.FirebaseItemsQuery<keyof DriverBalance.BalanceEvent> = false,
	select: App.FirebaseItemsFields = false,
	order: App.FirebaseOrderQuery = false,
	limit: number | false = false
): Promise<T[]> => {
	return queryItems(collectionName, query as any, select, order, limit);
};

export const getBalanceEventsByDriver = async <T = DriverBalance.BalanceEvent>(
	driverId: string,
	opts?: {
		from?: number;
		to?: number;
		limit?: number;
		offset?: number;
		status?: DriverBalance.BalanceEventStatus;
	}
): Promise<T[]> => {
	const queries: App.FirebaseQueryList = [
		[ 'driverId', '==', driverId ],
	];

	if (opts?.status) {
		queries.push([ 'status', '==', opts.status ]);
	}

	if (opts?.from) {
		queries.push([ 'timestamp', '>=', opts.from ]);
	}

	if (opts?.to) {
		queries.push([ 'timestamp', '<=', opts.to ]);
	}

	const order: App.FirebaseOrderQuery = [ 'timestamp', 'desc' ];
	const limit = opts?.limit ?? 50;

	return queryItems(collectionName, queries, false, order, limit);
};

export const getLatestBalanceEvent = async <T = DriverBalance.BalanceEvent>(
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
	status?: DriverBalance.BalanceEventStatus
): Promise<number> => {
	const queries: App.FirebaseQueryList = [ [ 'driverId', '==', driverId ] ];
	if (status) queries.push([ 'status', '==', status ]);
	return countQueryItems(collectionName, queries);
};

export const createBalanceEventsBatch = async (
	events: Partial<DriverBalance.BalanceEvent>[]
) => {
	return batchOperations(collectionName, events, 'set');
};

export const eventExists = async (id: string): Promise<boolean> => {
	const docRef = await getRef(collectionName).doc(id).get();
	return docRef.exists;
};