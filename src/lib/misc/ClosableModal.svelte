<script lang="ts">
    import { Modal, ModalBody, ModalFooter, ModalHeader } from '@sveltestrap/sveltestrap';
	import * as m from '$lib/paraglide/messages.js';

    interface Props {
        headerText?: string;
        isOpen?: ExplicitAnyToExtend;
        toggle?: any;
        size?: 'xl'|'lg'|'md'|'sm';
        centered?: boolean;
        buttonCaption?: string|boolean|null;
        id?: string;
        fullscreen?: boolean;
        onClick?: () => void;
        header?: import('svelte').Snippet;
        children?: import('svelte').Snippet;
    }

    let {
        headerText = '',
        isOpen = $bindable(false),
        toggle = () => { isOpen = !isOpen },
        size = 'md',
        centered = false,
        buttonCaption = $bindable(null),
        id = Math.random().toString().slice(2),
        fullscreen = false,
        header,
        children,
        onClick
    }: Props = $props();
    if (buttonCaption === true) buttonCaption = 'Zapisz';
</script>

<Modal bind:isOpen={isOpen} {toggle} {size} {centered} {id} {fullscreen}>
	<ModalHeader {toggle}>
        {#if header}{@render header()}{:else}
            {headerText}
        {/if}
    </ModalHeader>
	<ModalBody>
		{@render children?.()}
	</ModalBody>
	<ModalFooter>
        {#if buttonCaption} 
            <button class="btn btn-primary mb-0" onclick={onClick}>{buttonCaption}</button>
        {/if}
        <button class="btn btn-secondary mb-0" onclick={toggle}>{m.close()}</button>
	</ModalFooter>
</Modal>