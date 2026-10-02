import { z } from 'zod';

export const newWeeklyIngestationDataSchema = z.object({
	period: z.string().min(1, 'Okres jest wymagany (np. 2026-01)'),
	week: z.string().min(1, 'Tydzień jest wymagany (np. 2026-W04)'),
	platform: z.enum(['uber', 'bolt'], {
		errorMap: () => ({ message: 'Wybierz platformę' })
	} as any),
	provisionRate: z.number().min(0, 'Stawka prowizji musi być większa lub równa 0'),
	driverEntries: z.array(z.object({
		driverId: z.string().min(1, 'Kierowca jest wymagany'),
		grossEarnings: z.number().min(0, 'Kwota brutto musi być większa od 0'),
		platformCommission: z.number().min(0, 'Prowizja platformy musi być większa od 0')
	})).min(1, 'Musisz dodać co najmniej jednego kierowcę')
});
