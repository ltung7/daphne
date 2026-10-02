export interface WeeklyIngestionFormData {
	period: string;
	week: string;
	platform: 'uber' | 'bolt';
	provisionRate: number;
	boltRate: number;
	driverEntries: {
		driverId: string;
		grossEarnings: number;
		platformCommission: number;
	}[];
}
