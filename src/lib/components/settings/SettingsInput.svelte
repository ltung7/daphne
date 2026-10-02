<script lang="ts">
    import CustomFormCheckSwitch from '$lib/form/CustomFormCheckSwitch.svelte';
    import CustomFormNumeric from '$lib/form/CustomFormNumeric.svelte';
    import CustomFormText from '$lib/form/CustomFormText.svelte';
    import CustomFormSelect from '$lib/form/CustomFormSelect.svelte';
    import CustomFormColorPicker from '$lib/form/CustomFormColorPicker.svelte';
    import UIcon from '$lib/misc/UIcon.svelte';
    import type { CustomConfigNode } from '$lib/types/settings';
    
    interface Props {
        value?: any;
        item: CustomConfigNode;
        disabled?: boolean;
        changeNode: (node: string) => void;
    }

    let { value = $bindable(), item, disabled = false, changeNode }: Props = $props();
</script>

<div class="d-flex align-items-center justify-content-between py-2 px-1" id="setting-{item.node}">
    <div class="pe-3 flex-grow-1">
        <div class="fw-bold d-flex align-items-center gap-2 text-dark">
            {#if item.icon}
                <UIcon name={item.icon} size={5} />
            {/if}
            <span>{item.caption}</span>
        </div>
        {#if item.description}
            <div class="text-xs text-muted mt-1">{@html item.description}</div>
        {/if}
    </div>
    
    <div class="settings-controller d-flex align-items-center justify-content-end" style="width: 240px; min-width: 240px;">
        {#if item.type === 'boolean'}
            <div class="d-flex justify-content-end w-100">
                <CustomFormCheckSwitch
                    bind:checked={value}
                    {disabled}
                    size={4}
                    onChange={() => changeNode(item.node)}
                />
            </div>
        {:else if item.type === 'number'}
            <div class="w-100">
                <CustomFormNumeric
                    bind:value
                    min={item.min ?? 0}
                    max={item.max ?? 999999}
                    decimal={item.decimal ?? false}
                    readonly={disabled}
                    fullwidth={true}
                    size={6}
                    onChange={() => changeNode(item.node)}
                />
            </div>
        {:else if item.type === 'list'}
            <div class="w-100">
                <CustomFormSelect
                    list={item.options ?? {}}
                    bind:value
                    readonly={disabled}
                    size={6}
                    class="mb-0 me-0 w-100"
                    onchange={() => changeNode(item.node)}
                />
            </div>
        {:else if item.type === 'string'}
            <div class="w-100">
                <CustomFormText
                    bind:value
                    readonly={disabled}
                    size={6}
                    class="mb-0 w-100"
                    onChange={() => changeNode(item.node)}
                    onInput={() => changeNode(item.node)}
                />
            </div>
        {:else if item.type === 'color'}
            <div class="w-100">
                <CustomFormColorPicker
                    bind:value
                    {disabled}
                    class="mb-0 w-100"
                    width={240}
                    onchange={() => changeNode(item.node)}
                />
            </div>
        {/if}
    </div>
</div>
