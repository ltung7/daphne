export interface BoltSettings {
    boltRate: number;
    [key: string]: any;
}

export interface RideServices {
    bolt?: BoltSettings;
    [key: string]: any;
}

export interface CompanyFinances {
    provisionRate: number;
    [key: string]: any;
}

export interface CompanySettings {
    finances?: CompanyFinances;
    [key: string]: any;
}

export type SettingsGroups = {
    rideServices: RideServices;
    company: CompanySettings;
};