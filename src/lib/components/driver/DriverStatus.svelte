<script lang="ts">
	import { Tooltip } from '@sveltestrap/sveltestrap';
	import UIcon from "$lib/misc/UIcon.svelte";
	import { driverStatusMap } from './driverStatusMap';

	interface Props {
		status: Driver.Status;
		size?: number;
	}

	let { status, size = 8 }: Props = $props();

	let current = $derived(driverStatusMap[status]);
    let element = $state<HTMLElement>();
</script>

{#if element}
    <Tooltip target={element} placement="top">
        <span class="tooltip-text">{@html current.text}</span>
    </Tooltip>
{/if}

<div class="d-inline-flex align-items-center justify-contents-center fs-{size} badge cursor-help" style="background-color: {current.color};" bind:this={element}>
    <UIcon name={current.icon}  />
	<span class="ms-2">{current.caption}</span>
</div>
