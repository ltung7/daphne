<script lang="ts">
    import { Modal, ModalBody } from '@sveltestrap/sveltestrap';

    interface Props {
        isOpen?: ExplicitAnyToExtend;
        toggle?: any;
        size?: 'xl'|'lg'|'md'|'sm';
        centered?: boolean;
        id?: string;
        fullscreen?: boolean;
        children?: import('svelte').Snippet;
    }

    let {
        isOpen = $bindable(false),
        toggle = () => { isOpen = !isOpen },
        size = 'md',
        centered = false,
        id = Math.random().toString().slice(2),
        fullscreen = false,
        children,
    }: Props = $props();
</script>

<Modal bind:isOpen={isOpen} {toggle} {size} {centered} {id} {fullscreen}>
	<ModalBody>
		{@render children?.()}
	</ModalBody>
</Modal>