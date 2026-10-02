import type { ConfigsBlueprint } from '$lib/types/settings';
import { rideServicesBlueprintNode } from './rideServices.blueprint';
import { companyBlueprintNode } from './company.blueprint';

export type PlatformSettingSection = 'rideServices' | 'company';

export const platformSettingsBlueprint: ConfigsBlueprint<PlatformSettingSection> = {
    nodes: {
        rideServices: rideServicesBlueprintNode,
        company: companyBlueprintNode
    }
};

export { rideServicesBlueprintNode, companyBlueprintNode };
