import type { SvelteSet } from 'svelte/reactivity';
import type { BoltSettings, RideServices, CompanyFinances, CompanySettings, SettingsGroups } from './settings-data';

export type SettingNodeType = 'link' | 'boolean' | 'action' | 'number' | 'list' | 'string' | 'color';

export interface CustomConfigNode {
    type: SettingNodeType;
    node: string; // The property key or dot-notation path in the config object (e.g. 'finances.driverProvision')
    caption: string; // Label text
    description?: string; // Help text below the label
    admin?: boolean; // If true, only editable/visible to admins
    sub?: CustomConfigNode[]; // Nested settings shown conditionally when parent is truthy
    min?: number;
    max?: number;
    decimal?: boolean;
    icon?: string;
    link?: string;
    action?: (configs?: any) => void | Promise<void>;
    options?: Record<string, string>; // For dropdown lists
    adapters?: string[]; // Shows the setting only for specific integrations
    default?: any;
}

export interface ConfigsBlueprintNode {
    caption: string;
    anchor: string; // Used for sidebar navigation
    description?: string;
    icon?: string;
    customNodes?: string[]; // References to custom components injected at the bottom
    nodes: CustomConfigNode[];
}

export interface ConfigsBlueprint<T extends string = string> {
    nodes: Record<T, ConfigsBlueprintNode>;
    customComponents?: Record<string, CustomConfigNode>;
}

export interface SettingsStoreData {
    dirty: SvelteSet<string>;
    adapter?: string;
    [key: string]: any;
}

// Re-export shared data types for convenience
export type { BoltSettings, RideServices, CompanyFinances, CompanySettings, SettingsGroups };

export interface BoltSettingsData {
    boltRate: number;
}

export interface RideServicesSettingsData {
    bolt?: BoltSettingsData;
}

export interface CompanyFinancesSettingsData {
    provisionRate: number;
}

export interface CompanySettingsData {
    finances?: CompanyFinancesSettingsData;
}

export interface PlatformSettingsData {
    rideServices: RideServicesSettingsData;
    company: CompanySettingsData;
}

/**
 * Flattens a nested object into dot-notation keys.
 * e.g. { bolt: { rate: 0.15 } } -> { 'bolt.rate': 0.15 }
 */
export function flattenConfig(obj: Record<string, any>, prefix = ''): Record<string, any> {
    const flattened: Record<string, any> = {};
    for (const [ key, value ] of Object.entries(obj)) {
        const fullKey = prefix ? `${prefix}.${key}` : key;
        if (
            value !== null &&
            typeof value === 'object' &&
            !Array.isArray(value) &&
            !(value instanceof Set) &&
            !(value instanceof Date)
        ) {
            Object.assign(flattened, flattenConfig(value, fullKey));
        } else {
            flattened[fullKey] = value;
        }
    }
    return flattened;
}

/**
 * Reconstructs a nested object from dot-notation keys.
 * e.g. { 'bolt.rate': 0.15 } -> { bolt: { rate: 0.15 } }
 */
export function unflattenConfig(obj: Record<string, any>): Record<string, any> {
    const result: Record<string, any> = {};
    for (const [ key, value ] of Object.entries(obj)) {
        const parts = key.split('.');
        let current = result;
        for (let i = 0; i < parts.length - 1; i++) {
            const part = parts[i];
            if (!current[part] || typeof current[part] !== 'object') {
                current[part] = {};
            }
            current = current[part];
        }
        current[parts[parts.length - 1]] = value;
    }
    return result;
}

/**
 * Helper to get a value by dot-notation path or direct key.
 */
export function getConfigValue(configs: Record<string, any>, path: string, defaultValue?: any): any {
    if (configs[path] !== undefined) return configs[path];
    const parts = path.split('.');
    let curr = configs;
    for (const p of parts) {
        if (curr == null || typeof curr !== 'object') return defaultValue;
        curr = curr[p];
    }
    return curr !== undefined ? curr : defaultValue;
}
