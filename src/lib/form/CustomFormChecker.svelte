<script lang="ts">
	interface Props {
		name?: string;
		value?: boolean;
		caption?: string;
		checked: boolean;
		required?: boolean;
		class?: string;
		small?: boolean;
		children?: import('svelte').Snippet;
		onchange?: (e: Event) => void;
	}

	let { name = Math.random().toString().substring(2), value, caption, checked = $bindable(), required, class: className, small, onchange, children }: Props = $props();
</script>

<label class="cursor-pointer d-flex {className}" for="checkbox_{name}_{value}">
	<input type="checkbox" {name} class="d-none" {value} id="checkbox_{name}_{value}" bind:checked {onchange} />
	<div>
		<i class="mt-1 icon rotating-checker flex-center" class:checked class:require={required} class:small></i>
	</div>
	<div class="ms-2 flex-center" class:small>
		{#if children}
			{@render children()}
        {:else}
            {caption}
        {/if}
	</div>
</label>
