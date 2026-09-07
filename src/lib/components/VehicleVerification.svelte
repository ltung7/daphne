<script lang="ts">
	import { vehicleRequirements, verifyVehicleRequirements } from '$lib/assets/requirements';
	import InspectionCheckItem from '$lib/form/InspectionCheckItem.svelte';
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
	let verificationResult = $state<Record<RideServices.VehicleVerificationState, boolean>>({});

	const required = vehicleRequirements.filter(item => item.required).map(item => item.node);
	const verified = $derived(required.reduce((sum, node) => sum += verificationResult[node] ? 1 : 0, 0))

	onMount(() => {
		const fusedVerification: Vehicle.VehicleRequirementVerification = {
			...vehicle,
			...type
		};

		const result = verifyVehicleRequirements(fusedVerification, documents);
		Object.assign(verificationResult, result);
	});
</script>

<div class="flex-center">
	<IconButton caption="Weryfikuj stan pojazdu" icon="assessment" onclick={() => (isOpen = true)} size={6} />
	<div class="fs-6 ms-3 text-dark badge bg-info">{verified} / {required.length}</div>
</div>

<ClosableModal bind:isOpen size="xl" headerText="Status weryfikacji">
	<ul class="list-group">
		{#each vehicleRequirements as requirement}
			<InspectionCheckItem 
				bind:checked={verificationResult[requirement.node]}
				caption={requirement.name}
				service={requirement.service}
				required={requirement.required}
				text={requirement.text}
			/>
		{/each}
	</ul>
</ClosableModal>
