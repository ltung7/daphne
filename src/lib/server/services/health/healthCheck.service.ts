import { findHealthIssues, saveHealthIssues } from '$lib/server/db/firebase/healthIssues.fdb';
import { checkVehicleExpirationDates } from './checkers/vehicleExpirationDates.checker';
import { checkDriverExpirationDates } from './checkers/driverExpirationDates.checker';
import { resolveVehicleExpirationIssues } from './resolvers/vehicleExpirationDates.resolver';
import { resolveDriverExpirationIssues } from './resolvers/driverExpirationDates.resolver';

type HealthCheckParams = {
	vehicles?: Vehicle.Vehicle[];
	drivers?: Driver.Driver[];
	[key: string]: unknown;
};

type CheckerFn = (params: HealthCheckParams) => Promise<HealthCheck.HealthIssue[]>;
type ResolverFn = (issues: HealthCheck.HealthIssue[], params: HealthCheckParams) => Promise<void>;

const CHECKERS: Record<string, CheckerFn> = {
	vehicle: checkVehicleExpirationDates,
	driver: checkDriverExpirationDates
};

const RESOLVERS: Record<string, ResolverFn> = {
	vehicle: resolveVehicleExpirationIssues,
	driver: resolveDriverExpirationIssues
};

export const checkFleetProblems = async (params: HealthCheckParams = {}): Promise<HealthCheck.HealthCheckResult> => {
	const allIssues: HealthCheck.HealthIssue[] = [];

	await Promise.all(
		Object.entries(CHECKERS).map(async ([ key, checker ]) => {
			try {
				const issues = await checker(params);
				allIssues.push(...issues);
			} catch (error) {
				console.error(`Health check "${key}" failed:`, error);
			}
		})
	);

	const summary = allIssues.reduce(
		(acc, issue) => {
			acc[issue.severity]++;
			return acc;
		},
		{ critical: 0, warning: 0, info: 0 } as HealthCheck.HealthCheckResult['summary']
	);

	await saveHealthIssues(allIssues);

	// Resolve issues after saving - separate try/catch per resolver
	await Promise.all(
		Object.entries(RESOLVERS).map(async ([ key, resolver ]) => {
			try {
				const relevantIssues = allIssues.filter(i => i.entityType === key);
				if (relevantIssues.length > 0) {
					await resolver(relevantIssues, params);
				}
			} catch (error) {
				console.error(`Health resolver "${key}" failed:`, error);
			}
		})
	);

	return { issues: allIssues, summary };
};

export const getFleedProblemsSummary = async () => {
	const allIssues = await findHealthIssues();
	const summary = allIssues.reduce(
		(acc, issue) => {
			acc[issue.severity]++;
			return acc;
		},
		{ critical: 0, warning: 0, info: 0 } as HealthCheck.HealthCheckResult['summary']
	);
	return { issues: allIssues, summary };
};
