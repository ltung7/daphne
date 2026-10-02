import { getCurrentBalance, createBalanceEventsBatch } from '../db/firebase/driverBalanceEvents.fdb';
import * as companyLedgerEvents from '../db/firebase/companyLedgerEvents.fdb';
import { createPlatformPayout } from './companyLedger.service';
import { generateIdempotencyKey } from './ledger.service';
import saveJson from '$lib/utils/saveJson';

export interface WeeklyIngestionDriverEntry {
	driverId: string;
	grossEarnings: number;
	platformCommission: number;
}

export interface ProcessWeeklyIngestionParams {
	period: string;
	week: string;
	platform: 'uber' | 'bolt';
	provisionRate: number;
	boltRate?: number;
	driverEntries: WeeklyIngestionDriverEntry[];
	createdBy: string;
	createdByName: string;
	date?: Date;
}

export async function processWeeklyIngestion(params: ProcessWeeklyIngestionParams) {
	await saveJson(params, 'processWeeklyIngestion');
	return { success: true }
	const { period, week, platform, provisionRate, driverEntries, createdBy, createdByName, date = new Date() } = params;

	const balanceEventsToCreate: Partial<DriverBalance.BalanceEvent>[] = [];
	const companyEventsPromises: Promise<any>[] = [];

	for (const entry of driverEntries) {
		const { driverId, grossEarnings, platformCommission } = entry;

		// 1. Calculate Fleet Cut
		const fleetCut = Math.round(grossEarnings * provisionRate * 100) / 100;

		// 2. Calculate Driver Net
		const driverNet = Math.round((grossEarnings - platformCommission - fleetCut) * 100) / 100;

		// 3. Write to driverBalanceEvents
		const currentBalance = await getCurrentBalance(driverId);
		const newBalance = currentBalance + driverNet;

		const type: DriverBalance.BalanceEventType = platform === 'uber' ? 'income_uber' : 'income_bolt';
		const referenceId = week;
		const eventId = generateIdempotencyKey(driverId, type, referenceId, date);
		
		balanceEventsToCreate.push({
			id: eventId,
			driverId,
			type,
			status: 'confirmed',
			amount: driverNet,
			runningBalance: newBalance,
			referenceId,
			referenceType: platform === 'uber' ? 'uber_report' : 'bolt_report',
			metadata: {
				period,
			},
			timestamp: date.getTime(),
			createdBy,
			createdByName,
		});

		// 4. Write to companyLedgerEvents
		companyEventsPromises.push(
			createPlatformPayout(
				{
					platform,
					period,
					amount: fleetCut,
					referenceId,
					driverId,
					createdBy,
					createdByName,
					date,
				},
				companyLedgerEvents
			)
		);
	}

	// Wait for all company ledger events to be created
	await Promise.all(companyEventsPromises);

	// Batch create driver balance events
	if (balanceEventsToCreate.length > 0) {
		await createBalanceEventsBatch(balanceEventsToCreate);
	}

	return { success: true, processedDrivers: driverEntries.length };
}