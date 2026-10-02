import type { ConfigsBlueprintNode } from '$lib/types/settings';

export const companyBlueprintNode: ConfigsBlueprintNode = {
    caption: 'Firma i Finanse',
    anchor: 'Firma',
    description: 'Konfiguracja stawek i prowizji floty.',
    icon: 'building',
    nodes: [
        {
            caption: 'Stawka prowizji firmy floty',
            description: 'Prowizja floty pobierana od kierowcy jako procent od zarobków (np. 0.50 = 50%).',
            node: 'company.finances.provisionRate',
            type: 'number',
            decimal: true,
            default: 0.50,
            min: 0,
            max: 1
        }
    ]
};
