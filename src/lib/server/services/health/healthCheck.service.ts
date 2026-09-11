import { findHealthIssues, saveHealthIssues } from '$lib/server/db/firebase/healthIssues.fdb';
import { checkVehicleExpirationDates } from './vehicleExpirationDates.health';
import { checkDriverExpirationDates } from './driverExpirationDates.health';

type HealthCheckParams = {
	vehicles?: Vehicle.Vehicle[];
	drivers?: Driver.Driver[];
	[key: string]: unknown;
};

type CheckerFn = (params: HealthCheckParams) => Promise<HealthCheck.HealthIssue[]>;

const CHECKERS: Record<string, CheckerFn> = {
	vehicle: checkVehicleExpirationDates,
	driver: checkDriverExpirationDates
};

export const checkFleetProblems = async (params: HealthCheckParams = {}): Promise<HealthCheck.HealthCheckResult> => {
	const allIssues: HealthCheck.HealthIssue[] = [];

	await Promise.all(
		Object.entries(CHECKERS).map(async ([key, checker]) => {
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
