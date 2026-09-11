<script lang="ts">
	interface Props {
		name?: string;
		value?: string;
		width?: number;
		height?: number;
		class?: string;
		noauto?: boolean;
		id?: string;
		caption?: string;
		disabled?: boolean;
		onchange?: (e: Event) => void;
	}

	let { name = '', value = $bindable(''), width = 100, height = 28, class: addClass = 'mb-3', noauto = false, id = Math.random().toString().slice(2), caption = '', disabled = false, onchange }: Props = $props();
	const colors = [ 'black', 'white', 'silver', 'grey', 'blue', 'red', 'green', 'yellow', 'brown', 'orange', 'beige', 'gold' ];

	let isOpen = $state(false);

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

<div class="{addClass}">
	{#if caption}
		<label for={id} class="form-label small mb-1">{caption}</label>
	{/if}
	<div class="color-picker flex-between position-relative">
		<input type="hidden" bind:value {id} {name} autocomplete={noauto ? 'off' : ''} {onchange} />
		<button type="button" class="form-control overflow-hidden" style="width: {width}px; height: {height}px; background: {value};" onclick={() => isOpen = !isOpen} disabled={disabled} class:focus-visible={isOpen && !disabled}>
			<div class="flex-center position-relative">
				<div style="background: {value};"></div>
				{#if !disabled && isOpen}
					<div class="caret me-1"></div>
				{/if}
			</div>
		</button>

		{#if isOpen}
			<div class="values-dropdown p-3 border rounded" use:clickOutside={() => (isOpen = false)}>
				<div class="values-dropdown-grid">
					{#each colors as color, index}
						<button type="button" id="{id}-{index}" title={color} class:active={color === value} style="background: {color};" onclick={(e) => { value = color; isOpen = false; onchange?.(e) }} class="color-block border rounded"> </button>
					{/each}
				</div>
			</div>
		{/if}
	</div>
</div>

<style>
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
		left: 0;
	}

	.values-dropdown-grid {
		display: grid;
		grid-template-columns: repeat(4, 24px);
		grid-template-rows: repeat(3, 24px);
		grid-gap: 10px;
	}

	.values-dropdown.top {
		top: auto;
		bottom: 40px;
	}

	.values-dropdown button {
		border: none;
	}
</style>