<script lang="ts">
	import UIcon from '$lib/misc/UIcon.svelte';
	import StatusChangeModal from '$lib/misc/StatusChangeModal.svelte';

	interface Props {
		driver: Driver.Driver;
		onstatuschanged?: (status: Driver.Status) => void;
	}

	let { driver, onstatuschanged }: Props = $props();
</script>

<div class="flex-center">
	<StatusChangeModal
		caption="Zablokuj"
		icon="user-forbidden"
		color="danger"
		headerText="Zablokowanie kierowcy"
		submitText="Zablokuj kierowcę"
		noteLabel="Powód blokady"
		notePlaceholder="Podaj powód blokady..."
		url="/drivers/{driver.id}/status"
		targetStatus="banned"
		onsuccess={onstatuschanged}
	>
		{#snippet alert()}
			<div class="alert alert-danger mb-0 small text-white fw-bold">
				<div class="d-flex">
					<UIcon name="exclamation" size={2} />
					<div class="w-100 ms-3">
						<strong>Uwaga!</strong> Zablokowanie kierowcy to poważna akcja. Konto zostanie permanentnie zablokowane i kierowca straci dostęp do platformy.
					</div>
				</div>
			</div>
		{/snippet}
	</StatusChangeModal>
</div>
