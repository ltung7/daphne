<script lang="ts">
	interface Props {
		checked: boolean;
		caption: string;
		required?: boolean;
		text?: string;
		service?: string[];
	}
	let { checked = $bindable(), required, caption, text, service }: Props = $props();
	import CustomFormChecker from '$lib/form/CustomFormChecker.svelte';
</script>

<li class="list-group-item d-flex">
	<CustomFormChecker class="mb-0 w-100" bind:checked {required}>
		<div class="w-100">
			<div class="flex-between">
				<div class="fw-bold text-dark fs-6">
					{caption}
				</div>
				{#if service?.length}
					<div class="text-muted">
						{service.join(' | ')}
					</div>
				{/if}
			</div>
			{#if text?.length}<div class="text-muted text-normal">{text}</div>{/if}
		</div>
	</CustomFormChecker>
</li>
