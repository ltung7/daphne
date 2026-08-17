<script lang="ts">
	import { tick } from 'svelte';
	import { fade } from 'svelte/transition';

	interface Props {
		name?: string;
		value?: string;
		size?: number;
		addClass?: string;
		noauto?: boolean;
		id?: string;
		oninput?: (e: Event) => void;
		onchange?: (e: Event) => void;
	}

	let { name = '', value = $bindable(''), size = 16, addClass = 'my-3', noauto = false, id = Math.random().toString().slice(2), oninput, onchange }: Props = $props();

	const values = [
		[ '#000000', '#434343', '#666666', '#999999', '#b7b7b7', '#cccccc', '#d9d9d9', '#efefef', '#f3f3f3', '#ffffff' ],
		[ '#980000', '#ff0000', '#ff9900', '#ffff00', '#00ff00', '#00ffff', '#4a86e8', '#0000ff', '#9900ff', '#ff00ff' ],
		[ '#e6b8af', '#f4cccc', '#fce5cd', '#fff2cc', '#d9ead3', '#d0e0e3', '#c9daf8', '#cfe2f3', '#d9d2e9', '#ead1dc' ],
		[ '#dd7e6b', '#ea9999', '#f9cb9c', '#ffe599', '#b6d7a8', '#a2c4c9', '#a4c2f4', '#9fc5e8', '#b4a7d6', '#d5a6bd' ],
		[ '#cc4125', '#e06666', '#f6b26b', '#ffd966', '#93c47d', '#76a5af', '#6d9eeb', '#6fa8dc', '#8e7cc3', '#c27ba0' ],
		[ '#a61c00', '#cc0000', '#e69138', '#f1c232', '#6aa84f', '#45818e', '#3c78d8', '#3d85c6', '#674ea7', '#a64d79' ],
		[ '#85200c', '#990000', '#b45f06', '#bf9000', '#38761d', '#134f5c', '#1155cc', '#0b5394', '#351c75', '#741b47' ],
		[ '#5b0f00', '#660000', '#783f04', '#7f6000', '#274e13', '#0c343d', '#1c4587', '#073763', '#20124d', '#4c1130' ]
	];

	let windowHeight = $state(0);
	let top = $state(false);
	let ddActive = $state(false);
	let ddHeight = $state(158);

	// Replaces tweened — simple numeric $state driven by requestAnimationFrame
	let animProgress = $state(0);

	function animateTo(target: number, duration = 600) {
		const start = performance.now();
		const from = animProgress;

		function step(now: number) {
			const t = Math.min((now - start) / duration, 1);
			// ease-out cubic
			animProgress = from + (target - from) * (1 - Math.pow(1 - t, 3));
			if (t < 1) requestAnimationFrame(step);
		}

		requestAnimationFrame(step);
	}

	async function toggleDropdown(e: MouseEvent) {
		top = windowHeight - e.clientY < ddHeight;
		ddActive = !ddActive;

		await tick();
		if (ddActive) {
			animProgress = 0;
			animateTo(16);
		}
	}

	function changeValue(innerValue: string, e: Event) {
		value = innerValue;
		ddActive = false;
		onchange?.(e);
	}

	function clickOutside(node: HTMLElement, callback: () => void) {
		function handleClick(e: MouseEvent) {
			if (!node.contains(e.target as Node)) {
				callback();
			}
		}

		document.addEventListener('click', handleClick, true);

		return {
			destroy() {
				document.removeEventListener('click', handleClick, true);
			}
		};
	}
</script>

<svelte:window bind:innerHeight={windowHeight} />

<div class="color-picker flex-between {addClass}" style="--size:{2 * size}px">
	<input type="text" class="form-control" style="font-size: {size}px;" bind:value {id} {name} autocomplete={noauto ? 'off' : ''} {oninput} {onchange} />
	<!-- svelte-ignore a11y_consider_explicit_label -->
	<button class="ms-2 border-2 border-dark wh-size border border-oval flex-center overflow-hidden" onclick={toggleDropdown} class:fake-focus={ddActive}>
		<div class="flex-center position-relative">
			<div style="background: {value};" class="wh-size"></div>
			<div class="caret me-1" class:top></div>
		</div>
	</button>

	{#if ddActive}
		<div class:top bind:clientHeight={ddHeight} class="values-dropdown p-3 border rounded" use:clickOutside={() => (ddActive = false)} in:fade={{ delay: 100 }} out:fade={{ duration: 250 }}>
			<div class="values-dropdown-grid">
				{#each values as val, index}
					{#each val as innerValue, innerIndex}
						<!-- svelte-ignore a11y_consider_explicit_label -->
						<button id="{id}-{index}-{innerIndex}" class:active={innerValue === value} style="background: {innerValue};" onclick={(e) => changeValue(innerValue, e)} class="color-block border radius-45" class:show={index + innerIndex <= animProgress}> </button>
					{/each}
				{/each}
			</div>
		</div>
	{/if}
</div>

<style>
	.wh-size {
		min-width: var(--size);
		width: var(--size);
		min-height: var(--size);
		height: var(--size);
	}
	.border-oval {
		border-radius: 50%;
	}
	.color-picker-holder {
		position: relative;
	}

	.color-picker-inner {
		display: flex;
		height: 35px;
	}

	.select-color {
		padding: 3px;
		background: #fff;
		height: 35px;
	}

	.caret {
		width: 0;
		height: 0;
		border-left: 4px solid transparent;
		border-right: 4px solid transparent;
		border-top: 4px solid var(--bs-dark);
		position: absolute;
		bottom: 20%;
		right: 10%;
		margin-left: 4px;
	}

	.caret.top {
		border-left: 4px solid transparent;
		border-right: 4px solid transparent;
		border-bottom: 4px solid var(--bs-dark);
		border-top: none;
	}

	.active {
		box-shadow:
			inset 0 0 0 1px #fff,
			0 0 3px 1px rgba(0, 0, 0, 0.25);
	}

	.fake-focus,
	input:focus,
	button:focus {
		outline: 0;
	}

	.color-block {
		width: 24px;
		height: 24px;
		line-height: 0;
		font-size: 0;
	}

	.values-dropdown {
		position: absolute;
		z-index: 3;
		top: 40px;
		background: white;
		right: 0;
	}

	.values-dropdown-grid {
		grid-template-columns: repeat(10, 24px);
		grid-template-rows: 24px 24px;
		grid-gap: 10px;
		display: grid;
	}

	.values-dropdown.top {
		top: auto;
		bottom: 40px;
	}

	.values-dropdown button {
		border: none;
	}
</style>
