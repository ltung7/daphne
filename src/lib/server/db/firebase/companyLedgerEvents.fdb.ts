import {
	getItemById,
	queryItems,
	getLatest,
	countQueryItems,
	setItem,
	batchOperations,
	getRef,
} from './firebase';

const collectionName = 'companyLedgerEvents';

export const setLedgerEvent = async (id: string, data: Partial<CompanyLedger.LedgerEvent>) => {
	return setItem(id, data, collectionName, false);
};

export const getLedgerEvent = async <T = CompanyLedger.LedgerEvent>(id: string): Promise<T | null> => {
	return getItemById(id, collectionName);
};

export const getLedgerEvents = async <T = CompanyLedger.LedgerEvent>(
	query: App.FirebaseItemsQuery<keyof CompanyLedger.LedgerEvent> = false,
	select: App.FirebaseItemsFields = false,
	order: App.FirebaseOrderQuery = false,
	limit: number | false = false
): Promise<T[]> => {
	return queryItems(collectionName, query as any, select, order, limit);
};

export const getLedgerEventsByPeriod = async <T = CompanyLedger.LedgerEvent>(
	period: string,
	opts?: {
		type?: CompanyLedger.LedgerEventType;
		driverId?: string;
		vehicleId?: string;
		limit?: number;
	}
): Promise<T[]> => {
	const queries: App.FirebaseQueryList = [
		[ 'period', '==', period ],
	];

	if (opts?.type) {
		queries.push([ 'type', '==', opts.type ]);
	}

	if (opts?.driverId) {
		queries.push([ 'driverId', '==', opts.driverId ]);
	}

	if (opts?.vehicleId) {
		queries.push([ 'vehicleId', '==', opts.vehicleId ]);
	}

	const order: App.FirebaseOrderQuery = [ 'timestamp', 'asc' ];
	const limit = opts?.limit ?? 500;

	return queryItems(collectionName, queries, false, order, limit);
};

export const getLedgerEventsByDriver = async <T = CompanyLedger.LedgerEvent>(
	driverId: string,
	opts?: {
		period?: string;
		from?: number;
		to?: number;
		limit?: number;
	}
): Promise<T[]> => {
	const queries: App.FirebaseQueryList = [
		[ 'driverId', '==', driverId ],
	];

	if (opts?.period) {
		queries.push([ 'period', '==', opts.period ]);
	}

	if (opts?.from) {
		queries.push([ 'timestamp', '>=', opts.from ]);
	}

	if (opts?.to) {
		queries.push([ 'timestamp', '<=', opts.to ]);
	}

	const order: App.FirebaseOrderQuery = [ 'timestamp', 'asc' ];
	const limit = opts?.limit ?? 500;

	return queryItems(collectionName, queries, false, order, limit);
};

export const getLedgerEventsByVehicle = async <T = CompanyLedger.LedgerEvent>(
	vehicleId: string,
	opts?: {
		period?: string;
		from?: number;
		to?: number;
		limit?: number;
	}
): Promise<T[]> => {
	const queries: App.FirebaseQueryList = [
		[ 'vehicleId', '==', vehicleId ],
	];

	if (opts?.period) {
		queries.push([ 'period', '==', opts.period ]);
	}

	if (opts?.from) {
		queries.push([ 'timestamp', '>=', opts.from ]);
	}

	if (opts?.to) {
		queries.push([ 'timestamp', '<=', opts.to ]);
	}

	const order: App.FirebaseOrderQuery = [ 'timestamp', 'asc' ];
	const limit = opts?.limit ?? 500;

	return queryItems(collectionName, queries, false, order, limit);
};

export const getLedgerEventsByType = async <T = CompanyLedger.LedgerEvent>(
	type: CompanyLedger.LedgerEventType,
	opts?: {
		period?: string;
		from?: number;
		to?: number;
		limit?: number;
	}
): Promise<T[]> => {
	const queries: App.FirebaseQueryList = [
		[ 'type', '==', type ],
	];

	if (opts?.period) {
		queries.push([ 'period', '==', opts.period ]);
	}

	if (opts?.from) {
		queries.push([ 'timestamp', '>=', opts.from ]);
	}

	if (opts?.to) {
		queries.push([ 'timestamp', '<=', opts.to ]);
	}

	const order: App.FirebaseOrderQuery = [ 'timestamp', 'asc' ];
	const limit = opts?.limit ?? 500;

	return queryItems(collectionName, queries, false, order, limit);
};

export const sumLedgerEvents = async (
	period: string,
	type?: CompanyLedger.LedgerEventType
): Promise<number> => {
	const queries: App.FirebaseQueryList = [
		[ 'period', '==', period ],
	];

	if (type) {
		queries.push([ 'type', '==', type ]);
	}

	const events = await queryItems(collectionName, queries, [ 'amount' ], false, false);
	return events.reduce((sum, e) => sum + (e.amount ?? 0), 0);
};

export const sumLedgerEventsByDriver = async (
	period: string,
	driverId: string,
	type?: CompanyLedger.LedgerEventType
): Promise<number> => {
	const queries: App.FirebaseQueryList = [
		[ 'period', '==', period ],
		[ 'driverId', '==', driverId ],
	];

	if (type) {
		queries.push([ 'type', '==', type ]);
	}

	const events = await queryItems(collectionName, queries, [ 'amount' ], false, false);
	return events.reduce((sum, e) => sum + (e.amount ?? 0), 0);
};

export const sumLedgerEventsByVehicle = async (
	period: string,
	vehicleId: string,
	type?: CompanyLedger.LedgerEventType
): Promise<number> => {
	const queries: App.FirebaseQueryList = [
		[ 'period', '==', period ],
		[ 'vehicleId', '==', vehicleId ],
	];

	if (type) {
		queries.push([ 'type', '==', type ]);
	}

	const events = await queryItems(collectionName, queries, [ 'amount' ], false, false);
	return events.reduce((sum, e) => sum + (e.amount ?? 0), 0);
};

export const sumLedgerEventsByCategory = async (
	period: string,
	category: CompanyLedger.ExpenseCategory
): Promise<number> => {
	const queries: App.FirebaseQueryList = [
		[ 'period', '==', period ],
		[ 'type', '==', 'expense' ],
		[ 'metadata.expenseCategory', '==', category ],
	];

	const events = await queryItems(collectionName, queries, [ 'amount' ], false, false);
	return events.reduce((sum, e) => sum + (e.amount ?? 0), 0);
};

export const countLedgerEvents = async (
	period: string,
	type?: CompanyLedger.LedgerEventType
): Promise<number> => {
	const queries: App.FirebaseQueryList = [
		[ 'period', '==', period ],
	];

	if (type) {
		queries.push([ 'type', '==', type ]);
	}

	return countQueryItems(collectionName, queries);
};

export const createLedgerEventsBatch = async (
	events: Partial<CompanyLedger.LedgerEvent>[]
) => {
	return batchOperations(collectionName, events, 'set');
};

export const eventExists = async (id: string): Promise<boolean> => {
	const docRef = await getRef(collectionName).doc(id).get();
	return docRef.exists;
};

export const getLedgerEventsForReconciliation = async <T = CompanyLedger.LedgerEvent>(
	period: string
): Promise<T[]> => {
	const queries: App.FirebaseQueryList = [
		[ 'period', '==', period ],
	];

	const order: App.FirebaseOrderQuery = [ 'timestamp', 'asc' ];

	return queryItems(collectionName, queries, false, order, false);
};