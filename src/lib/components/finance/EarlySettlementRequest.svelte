<script lang="ts">
	import { m } from '$lib/paraglide/messages.js';
	import ClosableModal from '$lib/misc/ClosableModal.svelte';
	import IconButton from '$lib/misc/IconButton.svelte';
	import EarlySettlementForm from '$lib/components/finance/EarlySettlementForm.svelte';

	interface Props {
		driverId: string;
		driverName: string;
		balance: number;
	}

	let { driverId, driverName, balance }: Props = $props();

	let isOpen = $state(false);
	let formComponent = $state<ReturnType<typeof EarlySettlementForm>>();

	const openModal = () => {
		isOpen = true;
	};

	const closeModal = () => {
		isOpen = false;
	};

	async function handleSubmit() {
		await formComponent?.submit();
	}
</script>

<IconButton icon="fee" caption={m.early_settlement_request()} size={6} onclick={openModal} />

<ClosableModal {isOpen} toggle={closeModal} headerText={m.early_settlement_request()} size="md" buttonCaption={m.submit()} onClick={handleSubmit}>
	<EarlySettlementForm {driverId} {driverName} {balance} bind:this={formComponent} onsuccess={closeModal} />
</ClosableModal>
