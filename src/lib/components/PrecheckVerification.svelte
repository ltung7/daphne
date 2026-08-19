<script lang="ts">
	import { vehicleRequirements, verifyAllRequirements } from '$lib/assets/requirements';
	import CustomFormChecker from '$lib/form/CustomFormChecker.svelte';
	import ClosableModal from '$lib/misc/ClosableModal.svelte';
	import IconButton from '$lib/misc/IconButton.svelte';
	import { onMount } from 'svelte';

	let { vehicle, type, documents } = $props<{
		vehicle: Vehicle.Vehicle;
		type: Vehicle.Type;
		documents: Vehicle.VehicleDocument[];
	}>();
	let isOpen = $state(false);

	/** @ts-expect-error initial state */
	let verificationResult = $state<Record<RideServices.VerificationState, boolean>>({});
	onMount(() => {
		const fusedVerification: Vehicle.VehicleRequirementVerification = {
			...vehicle,
			...type
		};

		const result = verifyAllRequirements(fusedVerification, documents);
		Object.assign(verificationResult, result);
	});
</script>

<IconButton caption="Weryfikuj stan pojazdu" icon="assessment" onclick={() => (isOpen = true)} />

<ClosableModal bind:isOpen size="xl" headerText="Status weryfikacji">
	<ul class="list-group">
		{#each vehicleRequirements as requirement}
			<li class="list-group-item d-flex">
				<CustomFormChecker class="mb-0 w-100" bind:checked={verificationResult[requirement.node]} required>
					<div class="w-100">
						<div class="flex-between">
							<div class="fw-bold text-dark fs-6">
								{requirement.name}
							</div>
							<div class="text-muted">
								{requirement.service.join(' | ')}
							</div>
						</div>
						<div class="text-muted text-normal">{requirement.text}</div>
					</div>
				</CustomFormChecker>
			</li>
		{/each}
	</ul>
</ClosableModal>
