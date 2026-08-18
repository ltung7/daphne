<script lang="ts">
	import UIcon from './UIcon.svelte';

	interface Props {
		/** Optional colour to force a specific UIcon colour.
		 *  If omitted the component falls back to “success” when checked,
		 *  otherwise to “secondary”. */
		color?: string;

		/** Whether the feature flag is currently enabled. */
		checked: boolean;

		/** Size to pass through to the underlying <UIcon/> component. */
		size?: number;
	}

	// Define props using Svelte 5 runes
	let { color = '', checked, size = 4 }: Props = $props();

	// Determine the effective color
	const effectiveColor = $derived(color || (checked ? 'success' : 'secondary'));

	// Determine which icon to show
	const iconName = $derived(checked ? 'check-circle' : 'cross-circle');
</script>

<UIcon color={effectiveColor} name={iconName} {size} />
