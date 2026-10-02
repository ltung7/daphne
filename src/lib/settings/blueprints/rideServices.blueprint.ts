import type { ConfigsBlueprintNode } from '$lib/types/settings';

export const rideServicesBlueprintNode: ConfigsBlueprintNode = {
    caption: 'Usługi Przejazdów',
    anchor: 'Platformy',
    description: 'Konfiguracja stawek i prowizji dla platform zewnętrznych.',
    icon: 'car-side',
    nodes: [
        {
            caption: 'Stawka prowizji Bolt',
            description: 'Prowizja platformy Bolt jako procent od zarobków (np. 0.25 = 25%).',
            node: 'rideServices.bolt.boltRate',
            type: 'number',
            decimal: true,
            default: 0.25,
            min: 0,
            max: 1
        }
    ]
};
