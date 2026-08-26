<script lang="ts">
	import { driverRequirements, verifyDriverRequirements } from '$lib/assets/requirements';
	import CustomFormChecker from '$lib/form/CustomFormChecker.svelte';
	import ClosableModal from '$lib/misc/ClosableModal.svelte';
	import IconButton from '$lib/misc/IconButton.svelte';
	import { onMount } from 'svelte';

	let { driver, documents } = $props<{
		driver: Driver.Driver;
		documents: Driver.DriverDocument[];
	}>();
	let isOpen = $state(false);

	/** @ts-expect-error initial state */
	let verificationResult = $state<Record<RideServices.DriverVerificationState, boolean>>({});

	const required = driverRequirements.filter(item => item.required).map(item => item.node);
	const verified = $derived(
		required.reduce((sum, node) => sum += verificationResult[node] ? 1 : 0, 0)
		+ ((verificationResult.passportMainPage || (verificationResult.idCardBack && verificationResult.idCardFront) || (verificationResult.residencePermitBack && verificationResult.residencePermitFront)) ? 1 : 0)
	)

	onMount(() => {
		const result = verifyDriverRequirements(driver, documents);
		Object.assign(verificationResult, result);
	});
</script>

<div class="flex-center">
	<IconButton caption="Weryfikuj dokumenty kierowcy" icon="assessment" onclick={() => (isOpen = true)} size={6} />
	<div class="fs-6 ms-3 text-dark badge bg-info">{verified} / {1 + required.length}</div>
</div>
<ClosableModal bind:isOpen size="xl" headerText="Status weryfikacji">
	<ul class="list-group">
		{#each driverRequirements as requirement}
			<li class="list-group-item d-flex">
				<CustomFormChecker class="mb-0 w-100" bind:checked={verificationResult[requirement.node]} required={requirement.required}>
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
