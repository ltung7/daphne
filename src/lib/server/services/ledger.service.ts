import { slugify } from "transliteration";

function getWeekNumber(date: Date): number {
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
    const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
    return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
}

const idempotencyKeyGenerators: Record<DriverBalance.BalanceEventType, (driverId: string, referenceId?: string, date?: Date) => string> = {
    income_uber: (driverId: string, referenceId?: string, date = new Date()) => {
        if (referenceId) {
            return `u:${driverId}:${referenceId}`;
        }
        const year = date.getFullYear();
        const week = String(getWeekNumber(date)).padStart(2, '0');
        return `u:${driverId}:${year}W${week}`;
    },
    income_bolt: (driverId: string, referenceId?: string, date = new Date()) => {
        if (referenceId) {
            return `b:${driverId}:${referenceId}`;
        }
        const year = date.getFullYear();
        const week = String(getWeekNumber(date)).padStart(2, '0');
        return `b:${driverId}:${year}W${week}`;
    },
    penalty: (_driverId: string, referenceId?: string) => `p:${referenceId || `pen${Date.now()}`}`,
    settlement: (driverId: string, referenceId?: string, date = new Date()) => {
        if (referenceId) {
            return `s:${driverId}:${referenceId}`;
        }
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        return `s:${driverId}:${year}${month}`;
    },
    repayments: (_driverId: string, referenceId?: string) => `r:${referenceId || `rep${Date.now()}`}`,
    early_settlement_discount: (_driverId: string, referenceId?: string) => `e:${referenceId || `esd${Date.now()}`}`,
    cash_collection: (driverId: string, _referenceId?: string, date = new Date()) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `c:${driverId}:${year}${month}${day}`;
    },
    cash_deposit: (_driverId: string, referenceId?: string) => `d:${referenceId || `dep${Date.now()}`}`,
    cash_adjustment: (_driverId: string, referenceId?: string) => `a:${referenceId || `adj${Date.now()}`}`,
};

export function generateIdempotencyKey(
    driverId: string,
    type: DriverBalance.BalanceEventType,
    referenceId?: string,
    date?: Date
): string {
    const generator = idempotencyKeyGenerators[type];
    if (!generator) {
        throw new Error(`Unknown event type: ${type}`);
    }
    if (referenceId?.length) {
        referenceId = slugify(referenceId, { allowedChars: 'a-zA-Z0-9', separator: '' })
    }
    return generator(driverId, referenceId, date);
}

export const doledger = async () => {
    return "ledger";
};