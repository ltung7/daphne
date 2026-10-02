import { z } from 'zod';

export const boltSettingsSchema = z.object({
    boltRate: z
        .number()
        .min(0, { error: 'Stawka Bolt musi wynosić co najmniej 0' })
        .max(1, { error: 'Stawka Bolt nie może przekraczać 1 (100%)' })
        .default(0.25),
});

export const rideServicesSettingsSchema = z.object({
    bolt: boltSettingsSchema.optional(),
});

export const companyFinancesSettingsSchema = z.object({
    provisionRate: z
        .number()
        .min(0, { error: 'Stawka prowizji firmy musi wynosić co najmniej 0' })
        .max(1, { error: 'Stawka prowizji firmy nie może przekraczać 1 (100%)' })
        .default(0.50),
});

export const companySettingsSchema = z.object({
    finances: companyFinancesSettingsSchema.optional(),
});

export const platformSettingsSchema = z.object({
    rideServices: rideServicesSettingsSchema.optional(),
    company: companySettingsSchema.optional(),
});

// Dot-notation patch schema for updates
export const settingsPatchSchema = z.record(
    z.string(),
    z.union([ z.number(), z.string(), z.boolean() ])
);

// Inferred TypeScript types
export type BoltSettings = z.infer<typeof boltSettingsSchema>;
export type RideServices = z.infer<typeof rideServicesSettingsSchema>;
export type CompanyFinances = z.infer<typeof companyFinancesSettingsSchema>;
export type CompanySettings = z.infer<typeof companySettingsSchema>;
export type PlatformSettings = z.infer<typeof platformSettingsSchema>;
