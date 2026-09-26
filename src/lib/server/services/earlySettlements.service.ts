import { round } from '$lib/utils/round';
import { getCurrentBalance } from '$lib/server/db/firebase/driverBalanceEvents.fdb';
import { addEarlySettlement, getEarlySettlement, setEarlySettlement } from '$lib/server/db/firebase/earlySettlements.fdb';
import { EARLY_SETTLEMENT_FEE_RATE } from '$lib/assets/constants';
import { db } from '$lib/server/db/firebase/firebase';

interface CreateEarlySettlementParams {
	driverId: string;
	driverName: string;
	requestedAmount: number;
	createdBy: string;
	createdByName: string;
	metadata?: Record<string, any>;
}

interface CreateEarlySettlementResult {
	earlySettlement: DriverBalance.EarlySettlement;
}

function calculateFeeAndPayout(requestedAmount: number): { fee: number; actualPayout: number } {
	const fee = round(requestedAmount * EARLY_SETTLEMENT_FEE_RATE);
	const actualPayout = round(requestedAmount - fee);
	return { fee, actualPayout };
}

export async function createEarlySettlement(params: CreateEarlySettlementParams): Promise<CreateEarlySettlementResult> {
	const { driverId, driverName, requestedAmount, createdBy, createdByName, metadata = {} } = params;

	if (requestedAmount <= 0) {
		throw new Error('Requested amount must be positive');
	}

	const currentBalance = await getCurrentBalance(driverId);
	const { fee, actualPayout } = calculateFeeAndPayout(requestedAmount);

	if (currentBalance < requestedAmount) {
		throw new Error(`Insufficient balance. Current: ${currentBalance.toFixed(2)} PLN, Requested: ${requestedAmount.toFixed(2)} PLN`);
	}

	const now = Date.now();

	const earlySettlementData: Omit<DriverBalance.EarlySettlement, 'id'> = {
		driverId,
		driverName,
		requestedAmount: round(requestedAmount),
		fee,
		actualPayout,
		status: 'requested',
		createdAt: now,
		createdBy,
		createdByName,
		metadata,
	};

	const id = await addEarlySettlement(earlySettlementData);

	if (!id) {
		throw new Error('Failed to create early settlement in database');
	}

	const earlySettlement: DriverBalance.EarlySettlement = {
		id,
		...earlySettlementData
	};

	return { earlySettlement };
}

export async function getEarlySettlementById(id: string) {
	return getEarlySettlement(id);
}

export async function cancelEarlySettlement(id: string) {
	const earlySettlement = await getEarlySettlement(id);
	if (!earlySettlement) throw new Error('Early settlement not found');
	if (earlySettlement.status !== 'requested') {
		throw new Error('Only requested early settlements can be cancelled');
	}

	await setEarlySettlement(id, { status: 'cancelled' });
}

export async function rejectEarlySettlement(
	id: string,
	reason: string,
	rejectedBy: string,
	rejectedByName: string
) {
	const earlySettlement = await getEarlySettlement(id);
	if (!earlySettlement) throw new Error('Early settlement not found');
	if (earlySettlement.status !== 'requested') {
		throw new Error('Only requested early settlements can be rejected');
	}

	await setEarlySettlement(id, {
		status: 'rejected',
		rejectedAt: Date.now(),
		rejectedBy,
		rejectedByName,
		rejectionReason: reason
	});
}

export async function approveEarlySettlement(
	id: string,
	approvedBy: string,
	approvedByName: string
) {
	const firestore = db();

	await firestore.runTransaction(async (transaction) => {
		const esRef = firestore.collection('earlySettlements').doc(id);
		const esDoc = await transaction.get(esRef);

		if (!esDoc.exists) {
			throw new Error('Early settlement not found');
		}

		const esData = esDoc.data() as DriverBalance.EarlySettlement;

		if (esData.status !== 'requested') {
			throw new Error('Only requested early settlements can be approved');
		}

		const latestEventQuery = firestore.collection('driverBalanceEvents')
			.where('driverId', '==', esData.driverId)
			.orderBy('timestamp', 'desc')
			.limit(1);

		const latestEventSnap = await transaction.get(latestEventQuery);
		let runningBalance = 0;
		if (!latestEventSnap.empty) {
			runningBalance = latestEventSnap.docs[0].data().runningBalance;
		}

		if (runningBalance < esData.requestedAmount) {
			throw new Error(`Insufficient balance for early settlement. Current: ${runningBalance.toFixed(2)} PLN`);
		}

		const now = Date.now();

		transaction.update(esRef, {
			status: 'approved',
			approvedAt: now,
			approvedBy,
			approvedByName
		});

		const payoutAmount = -esData.actualPayout;
		const payoutRunningBalance = round(runningBalance + payoutAmount);

		const payoutEventRef = firestore.collection('driverBalanceEvents').doc(`s:early:${id}`);
		const payoutEvent: DriverBalance.BalanceEvent = {
			id: `s:early:${id}`,
			driverId: esData.driverId,
			type: 'settlement',
			status: 'confirmed',
			amount: payoutAmount,
			runningBalance: payoutRunningBalance,
			referenceId: id,
			referenceType: 'settlement',
			metadata: { 
				earlySettlement: true, 
				requestedAmount: esData.requestedAmount, 
				fee: esData.fee, 
				payout: esData.actualPayout 
			},
			timestamp: now,
			createdBy: approvedBy,
			createdByName: approvedByName
		};
		transaction.set(payoutEventRef, payoutEvent);

		const feeAmount = -esData.fee;
		const finalRunningBalance = round(payoutRunningBalance + feeAmount);

		const feeEventRef = firestore.collection('driverBalanceEvents').doc(`e:${id}`);
		const feeEvent: DriverBalance.BalanceEvent = {
			id: `e:${id}`,
			driverId: esData.driverId,
			type: 'early_settlement_discount',
			status: 'confirmed',
			amount: feeAmount,
			runningBalance: finalRunningBalance,
			referenceId: id,
			referenceType: 'settlement',
			metadata: { 
				earlySettlement: true, 
				requestedAmount: esData.requestedAmount, 
				fee: esData.fee, 
				payout: esData.actualPayout 
			},
			timestamp: now,
			createdBy: approvedBy,
			createdByName: approvedByName
		};
		transaction.set(feeEventRef, feeEvent);
	});
}