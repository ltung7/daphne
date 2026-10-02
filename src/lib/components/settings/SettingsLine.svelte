<script lang="ts">
    import { untrack } from 'svelte';
    import { slide } from 'svelte/transition';
    import type { Writable } from 'svelte/store';
    import SettingsInput from './SettingsInput.svelte';
    import SettingsButton from './SettingsButton.svelte';
    import SettingsLine from './SettingsLine.svelte';
    import type { CustomConfigNode, SettingsStoreData } from '$lib/types/settings';

    interface Props {
        configs: Writable<SettingsStoreData>;
        item: CustomConfigNode;
        isAdmin?: boolean;
    }

    let { configs, item, isAdmin = false }: Props = $props();

    const name = untrack(() => item.node);
    const disabled = untrack(() => Boolean(item.admin && !isAdmin));

    const changeNode = (node: string) => {
        $configs.dirty.add(node);
    };

    // Hydrate default value if missing in configs store
    if (typeof $configs[name] === 'undefined') {
        const initItem = untrack(() => item);
        if (initItem.default !== undefined) {
            $configs[name] = initItem.default;
        } else if (initItem.type === 'boolean') {
            $configs[name] = false;
        } else if (initItem.type === 'number') {
            $configs[name] = 0;
        } else if (initItem.type === 'string') {
            $configs[name] = '';
        }
    }
</script>

{#if item.type === 'link' || item.type === 'action'}
    <SettingsButton {item} {disabled} />
{:else}
    <SettingsInput {item} {disabled} {changeNode} bind:value={$configs[name]} />
{/if}

<!-- Conditional Sub-Settings -->
{#if item.sub && item.sub.length > 0 && $configs[name]}
    <div class="ps-4 border-start ms-2" transition:slide>
        {#each item.sub as subitem (subitem.node)}
            <SettingsLine {configs} item={subitem} {isAdmin} />
        {/each}
    </div>
{/if}
