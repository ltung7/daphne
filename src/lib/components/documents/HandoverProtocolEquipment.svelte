<script lang="ts" generics="T extends DocumentGenerator.HandoverDocument = DocumentGenerator.HandoverDocument">
	import CustomFormCheckSwitch from '$lib/form/CustomFormCheckSwitch.svelte';
	import { handoverEquipmentList, type HandoverEquipmentKey, type RequiredEquipment } from '$lib/assets/constants';

	interface Props {
		handoverProtocol: T;
		requiredEquipment?: RequiredEquipment;
		readonly?: boolean;
	}

	let { handoverProtocol = $bindable(), requiredEquipment, readonly }: Props = $props();

	const isItemRequired = (key: HandoverEquipmentKey): boolean => {
		if (!requiredEquipment) return false;
		return !!requiredEquipment[key];
	};

	const isItemDisabled = (key: HandoverEquipmentKey): boolean => {
		if (readonly) return true;
		if (requiredEquipment && !requiredEquipment[key]) return true;
		return false;
	};

	$effect(() => {
		if (requiredEquipment) {
			for (const item of handoverEquipmentList) {
				if (!requiredEquipment[item.key] && handoverProtocol[item.key]) {
					handoverProtocol[item.key] = false;
				}
			}
		}
	});

	const col1 = handoverEquipmentList.slice(0, 7);
	const col2 = handoverEquipmentList.slice(7);
</script>

<div class="col-12 col-md-6 mb-3">
	{#each col1 as item}
		<CustomFormCheckSwitch
			caption={item.label}
			bind:checked={handoverProtocol[item.key]}
			disabled={isItemDisabled(item.key)}
			required={isItemRequired(item.key)}
		/>
	{/each}
</div>
<div class="col-12 col-md-6 mb-3">
	{#each col2 as item}
		<CustomFormCheckSwitch
			caption={item.label}
			bind:checked={handoverProtocol[item.key]}
			disabled={isItemDisabled(item.key)}
			required={isItemRequired(item.key)}
		/>
	{/each}
</div>