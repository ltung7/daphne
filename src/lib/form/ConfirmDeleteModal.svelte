<script lang="ts">
    import UIcon from "$lib/misc/UIcon.svelte";
    import { Modal } from '@sveltestrap/sveltestrap';
    import CustomFormText from "./CustomFormText.svelte";
    import * as m from '$lib/paraglide/messages.js';

    interface Props {
        action: any;
        keyword?: string;
        confirmBtnText?: string;
        isOpen?: boolean;
        confirmed?: boolean;
        children?: import('svelte').Snippet;
    }

    let {
        action,
        keyword = $bindable(m.confirmdeletekeyword()),
        confirmBtnText = '',
        isOpen = $bindable(false),
        confirmed = $bindable(false),
        children
    }: Props = $props();
    if (!keyword || keyword.length === 0) keyword = m.confirmdeletekeyword();
    else keyword = keyword.trim();
    let deleteInput = $state(''), deleteReady = $state(false);

    async function checkConfirm() {
        if (deleteInput.length !== keyword.length) return deleteReady = false;
        deleteReady = deleteInput === keyword;
    }

    async function send(event: Event) {
        event.preventDefault();
        if (!deleteReady) return;
        confirmed = Boolean(deleteInput);
        deleteInput = '';
        if (action) action();

        setTimeout(() => {
            isOpen = false;
            confirmed = false;
        }, 1000)
    }

    async function toggle() {
        isOpen = !isOpen;
        deleteReady = false;
    }
</script>

<Modal body centered size="sm" header={m.confirmdeletelbl()} {isOpen} {toggle}>
    {#if confirmed}
        <h5 class="text-danger mt-2 mb-4 text-center">{m.confirmdeletedone()}</h5>
        <button class="btn btn-sm btn-secondary w-100">{m.close()}</button>
    {:else}
        <p class="text-center">
            {#if children}{@render children()}{:else}
                {@html m.confirmdelete({ keyword })}
            {/if}
        </p>
        <form onsubmit={send}>
            <CustomFormText name="confirmDelete" caption={m.confirmdeletelbl()} bind:value={deleteInput} onInput={checkConfirm}/>
            <button class="btn btn-danger w-100 mb-0" disabled={!deleteReady}>
                <UIcon name="trash" size={4} />
                {#if confirmBtnText.length}
                    {@html confirmBtnText}
                {:else}
                    {m.confirmdeletebtn()}
                {/if}
            </button>
        </form>
    {/if}
</Modal>