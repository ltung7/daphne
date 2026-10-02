<script lang="ts">
    import { untrack } from 'svelte';
    import SettingsLine from './SettingsLine.svelte';
    import UIcon from '$lib/misc/UIcon.svelte';
    import type { Writable } from 'svelte/store';
    import type { ConfigsBlueprint, SettingsStoreData } from '$lib/types/settings';
    
    interface Props {
        configs: Writable<SettingsStoreData>;
        header: string;
        node: string;
        isAdmin?: boolean;
        blueprint: ConfigsBlueprint<any>;
    }

    let { configs, header, node, isAdmin = false, blueprint }: Props = $props();
    
    const configNode = untrack(() => blueprint.nodes[node]);
    
    let items = $derived.by(() => {
        if (!configNode?.nodes) return [];
        const currentAdapter = $configs?.adapter;
        return configNode.nodes.filter(
            item => !item.adapters || (currentAdapter && item.adapters.includes(currentAdapter))
        );
    });
</script>

{#if configNode}
    <div class="card mb-4" id="section-block-{node}">
        <div class="card-header pb-2">
            <div class="d-flex align-items-center gap-2 mb-1">
                {#if configNode.icon}
                    <UIcon name={configNode.icon} size={5} color="primary" />
                {/if}
                <h5 id="{node}" class="mb-0 text-dark fw-bold">{header}</h5>
            </div>
            {#if configNode.description}
                <p class="text-xs text-muted mb-0">{configNode.description}</p>
            {/if}
        </div>
        <div class="card-body pt-0">
            {#if items.length > 0}
                <div class="d-flex flex-column">
                    {#each items as item (item.node)} 
                        <SettingsLine {item} {configs} {isAdmin} />
                    {/each}
                </div>
            {:else}
                <p class="text-xs text-muted mb-0">No settings available for this section.</p>
            {/if}
        </div>
    </div>
{/if}
