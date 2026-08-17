<script lang="ts">
	import { untrack } from 'svelte';
	import UIcon from './UIcon.svelte';
	import * as m from '$lib/paraglide/messages.js';

	interface Props {
		options: Streamer.StreamerOptions;
		basket: Streamer.StreamerBasket;
		disabled?: boolean;
        onClick?: () => void;
	}
	let { options, basket, disabled, onClick }: Props = $props();
	if (untrack(() => basket.paidValue)) disabled = true;

	let redirect = $derived(options?.redirect ? `${options.redirect}
		?liveproducts=${basket.products ? basket.products!.map((item) => item.sku + ':' + item.quantity).join(',') : ''}
		&utm_source=livestreambasket&utm_medium=affiliate&utm_campaign=basket_${basket.id}&livestreambasket=${basket.id}
	` : "");
</script>

{#if options?.redirect}
	<a href={redirect} class="btn btn-primary flex-center w-100" class:disabled target="_blank" onclick={onClick}>
		<UIcon name="shop" class="me-2" gradient />
		{options.redirectText ?? m.finishInShop()}
	</a>
{/if}
