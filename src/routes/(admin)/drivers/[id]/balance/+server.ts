import { restrictAdmin } from "$lib/server/auth";
import {
    getBalanceEventsByDriver,
    setBalanceEvent,
    getCurrentBalance,
    eventExists
} from "$lib/server/db/firebase/driverBalanceEvents.fdb";
import { generateIdempotencyKey } from "$lib/server/services/ledger.service";
import { isDev } from "$lib/utils/isDev";
import type { RequestHandler } from "./$types";
import { json, error } from "@sveltejs/kit";

export const GET: RequestHandler = async ({ params, url, locals, setHeaders }) => {
    restrictAdmin(locals);

    const driverId = params.id;
    const offset = Number(url.searchParams.get('offset')) || 0;
    const limit = Number(url.searchParams.get('limit')) || 20;

    const events = await getBalanceEventsByDriver(driverId, { limit, offset });

    if (isDev) setHeaders({
        "cache-control": "max-age=3600"
    });

    return json({ events });
};

export const POST: RequestHandler = async ({ params, request, locals }) => {
    restrictAdmin(locals);

    const driverId = params.id;
    const user = locals._user;

    if (!user?.id) {
        throw error(401, 'Unauthorized');
    }

    const body = await request.json();
    const { amount, type, metadata = {} } = body;
    const referenceId = body.referenceId || metadata.referenceId || '';

    if (!type || typeof amount !== 'number') {
        throw error(400, 'Missing required fields: type, amount');
    }

    // Validate event type
    const validTypes = [
        'income_uber',
        'income_bolt',
        'penalty',
        'settlement',
        'repayments',
        'early_settlement_discount',
        'cash_collection',
        'cash_deposit',
        'cash_adjustment'
    ];

    if (!validTypes.includes(type)) {
        throw error(400, `Invalid event type: ${type}`);
    }

    // Generate idempotency key
    const idempotencyKey = generateIdempotencyKey(driverId, type as DriverBalance.BalanceEventType, referenceId);

    // Check for duplicate
    const exists = await eventExists(idempotencyKey);
    if (exists) {
        throw error(409, 'Event with this idempotency key already exists');
    }

    // Get current balance to compute running balance
    const currentBalance = await getCurrentBalance(driverId);
    const runningBalance = Math.round((currentBalance + amount) * 100) / 100;

    // Map event type to referenceType
    const referenceTypeMap: Record<DriverBalance.BalanceEventType, DriverBalance.BalanceEvent['referenceType']> = {
        income_uber: 'uber_report',
        income_bolt: 'bolt_report',
        penalty: 'penalty',
        settlement: 'settlement',
        repayments: 'settlement',
        early_settlement_discount: 'settlement',
        cash_collection: 'cash',
        cash_deposit: 'cash',
        cash_adjustment: 'cash'
    };

    const eventData: DriverBalance.BalanceEvent = {
        id: idempotencyKey,
        driverId,
        type,
        status: 'confirmed' as const,
        amount: Math.round(amount * 100) / 100,
        runningBalance,
        referenceId,
        referenceType: referenceTypeMap[type as DriverBalance.BalanceEventType],
        metadata,
        timestamp: Date.now(),
        createdBy: user.id,
        createdByName: user.name
    };

    await setBalanceEvent(idempotencyKey, eventData);

    return json({ eventData, success: true });
};