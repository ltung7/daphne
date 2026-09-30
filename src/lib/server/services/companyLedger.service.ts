import { slugify } from "transliteration";

function getWeekNumber(date: Date): number {
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
    const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
    return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
}

function getMonthKey(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
}

const idempotencyKeyGenerators: Record<CompanyLedger.LedgerEventType, (referenceId?: string, date?: Date) => string> = {
    platform_payout_uber: (referenceId?: string, date = new Date()) => {
        if (referenceId) {
            return `up:${referenceId}`;
        }
        const year = date.getFullYear();
        const week = String(getWeekNumber(date)).padStart(2, '0');
        return `up:auto:${year}W${week}`;
    },
    platform_payout_bolt: (referenceId?: string, date = new Date()) => {
        if (referenceId) {
            return `bp:${referenceId}`;
        }
        const year = date.getFullYear();
        const week = String(getWeekNumber(date)).padStart(2, '0');
        return `bp:auto:${year}W${week}`;
    },
    expense: (referenceId?: string, date = new Date()) => {
        const ts = date.getTime();
        return `ex:${referenceId || `exp${ts}`}`;
    },
    driver_payouts_batch: (referenceId?: string, date = new Date()) => {
        if (referenceId) {
            return `dpb:${referenceId}`;
        }
        return `dpb:auto:${getMonthKey(date)}`;
    },
};

export function generateCompanyLedgerIdempotencyKey(
    type: CompanyLedger.LedgerEventType,
    referenceId?: string,
    date?: Date
): string {
    const generator = idempotencyKeyGenerators[type];
    if (!generator) {
        throw new Error(`Unknown company ledger event type: ${type}`);
    }
    if (referenceId?.length) {
        referenceId = slugify(referenceId, { allowedChars: 'a-zA-Z0-9', separator: '' })
    }
    return generator(referenceId, date);
}

export interface CreateLedgerEventParams {
    type: CompanyLedger.LedgerEventType;
    period: string;
    amount: number;
    driverId?: string;
    vehicleId?: string;
    referenceId?: string;
    metadata?: CompanyLedger.LedgerEvent['metadata'];
    createdBy: string;
    createdByName: string;
    idempotencyKey?: string;
    date?: Date;
}

export interface PlatformPayoutParams {
    platform: 'uber' | 'bolt';
    period: string;
    amount: number;
    referenceId?: string;
    driverId?: string;
    vehicleId?: string;
    createdBy: string;
    createdByName: string;
    date?: Date;
}

export interface ExpenseParams {
    period: string;
    amount: number;
    expenseCategory: CompanyLedger.ExpenseCategory;
    description?: string;
    driverId?: string;
    vehicleId?: string;
    referenceId?: string;
    createdBy: string;
    createdByName: string;
    metadata?: Record<string, any>;
    date?: Date;
}

export interface DriverPayoutBatchParams {
    period: string;
    amount: number;
    referenceId?: string;
    createdBy: string;
    createdByName: string;
    date?: Date;
}

export async function createLedgerEvent(
    params: CreateLedgerEventParams,
    db: typeof import('../db/firebase/companyLedgerEvents.fdb')
): Promise<{ id: string; event: CompanyLedger.LedgerEvent }> {
    const idempotencyKey = params.idempotencyKey || generateCompanyLedgerIdempotencyKey(params.type, params.referenceId, params.date);
    
    const exists = await db.eventExists(idempotencyKey);
    if (exists) {
        const existing = await db.getLedgerEvent(idempotencyKey);
        if (existing) {
            return { id: idempotencyKey, event: existing };
        }
    }

    const event: CompanyLedger.LedgerEvent = {
        id: idempotencyKey,
        period: params.period,
        type: params.type,
        amount: params.amount,
        driverId: params.driverId,
        vehicleId: params.vehicleId,
        referenceId: params.referenceId,
        metadata: params.metadata || {},
        timestamp: (params.date || new Date()).getTime(),
        createdBy: params.createdBy,
        createdByName: params.createdByName,
    };

    await db.setLedgerEvent(idempotencyKey, event);
    return { id: idempotencyKey, event };
}

export async function createPlatformPayout(
    params: PlatformPayoutParams,
    db: typeof import('../db/firebase/companyLedgerEvents.fdb')
): Promise<{ id: string; event: CompanyLedger.LedgerEvent }> {
    const type = params.platform === 'uber' ? 'platform_payout_uber' : 'platform_payout_bolt';
    return createLedgerEvent({
        type,
        period: params.period,
        amount: Math.abs(params.amount),
        driverId: params.driverId,
        vehicleId: params.vehicleId,
        referenceId: params.referenceId,
        metadata: {
            description: `${params.platform.toUpperCase()} platform payout`,
        },
        createdBy: params.createdBy,
        createdByName: params.createdByName,
        date: params.date,
    }, db);
}

export async function createExpense(
    params: ExpenseParams,
    db: typeof import('../db/firebase/companyLedgerEvents.fdb')
): Promise<{ id: string; event: CompanyLedger.LedgerEvent }> {
    return createLedgerEvent({
        type: 'expense',
        period: params.period,
        amount: -Math.abs(params.amount),
        driverId: params.driverId,
        vehicleId: params.vehicleId,
        referenceId: params.referenceId,
        metadata: {
            expenseCategory: params.expenseCategory,
            description: params.description,
            ...params.metadata,
        },
        createdBy: params.createdBy,
        createdByName: params.createdByName,
        date: params.date,
    }, db);
}

export async function createDriverPayoutBatch(
    params: DriverPayoutBatchParams,
    db: typeof import('../db/firebase/companyLedgerEvents.fdb')
): Promise<{ id: string; event: CompanyLedger.LedgerEvent }> {
    return createLedgerEvent({
        type: 'driver_payouts_batch',
        period: params.period,
        amount: -Math.abs(params.amount),
        referenceId: params.referenceId,
        metadata: {
            description: 'Batch driver payouts',
        },
        createdBy: params.createdBy,
        createdByName: params.createdByName,
        date: params.date,
    }, db);
}

export async function getPeriodSummary(period: string, db: typeof import('../db/firebase/companyLedgerEvents.fdb')): Promise<{
    platformPayoutUber: number;
    platformPayoutBolt: number;
    totalPlatformPayouts: number;
    expenses: number;
    expensesByCategory: Record<CompanyLedger.ExpenseCategory, number>;
    driverPayoutsBatch: number;
    net: number;
}> {
    const [
        uberPayout,
        boltPayout,
        expenses,
        driverPayouts,
    ] = await Promise.all([
        db.sumLedgerEvents(period, 'platform_payout_uber'),
        db.sumLedgerEvents(period, 'platform_payout_bolt'),
        db.sumLedgerEvents(period, 'expense'),
        db.sumLedgerEvents(period, 'driver_payouts_batch'),
    ]);

    const categories: CompanyLedger.ExpenseCategory[] = ['fuel', 'maintenance', 'insurance', 'ticket', 'cleaning', 'towing', 'lease', 'office', 'other'];
    const expensesByCategory: Record<CompanyLedger.ExpenseCategory, number> = {} as any;
    for (const cat of categories) {
        expensesByCategory[cat] = await db.sumLedgerEventsByCategory(period, cat);
    }

    return {
        platformPayoutUber: uberPayout,
        platformPayoutBolt: boltPayout,
        totalPlatformPayouts: uberPayout + boltPayout,
        expenses,
        expensesByCategory,
        driverPayoutsBatch: driverPayouts,
        net: uberPayout + boltPayout + expenses + driverPayouts,
    };
}