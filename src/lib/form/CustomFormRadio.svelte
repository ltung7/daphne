<script lang="ts">
	interface Props {
		name: string;
		value: string;
		caption?: string;
		disabled?: boolean;
		class?: string;
		selected?: string;
		onChange?: (value: string) => void;
		children?: import('svelte').Snippet;
	}

	let { selected = $bindable(''), name = Math.random().toString().slice(2), value = Math.random().toString().slice(2), caption = '', class: className = '', disabled, onChange, children }: Props = $props();
	let id = $derived(`radio-${name}-${value}`);
    
    const handleSelect = () => {
        selected = value;
        onChange?.(value);
    }
</script>

<div class="form-check form-check-radio {className}">
	<input class="form-check-input" type="radio" {name} {id} onchange={handleSelect} checked={selected === value} {disabled} />
	<label class="form-check-label" for={id}>
		{#if children}
			{@render children?.()}
		{:else}
			<div class="fw-bold fs-6">{caption}</div>
		{/if}
	</label>
</div>
