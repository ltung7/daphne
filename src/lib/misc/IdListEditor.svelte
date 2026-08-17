<script lang="ts">
	import UploadIdsFile from '$lib/misc/UploadIdsFile.svelte';
	import { Collapse } from '@sveltestrap/sveltestrap';
	import IdList from '$lib/misc/IdList.svelte';
	import CustomFormText from '$lib/form/CustomFormText.svelte';
	import TooltipSquareIconButton from '$lib/misc/TooltipSquareIconButton.svelte';
	import { addToast } from '$lib/toast/store.js';
	import dayjs from 'dayjs';
	import { SvelteSet } from 'svelte/reactivity';
	import * as m from '$lib/paraglide/messages.js';
	
	interface Props {
		listSet?: SvelteSet<string>;
		downloadName?: string;
		onChange?: (ids: string[]) => void;
	}

	let {
		listSet = $bindable(new SvelteSet<string>()),
		downloadName = 'productIds',
		onChange
	}: Props = $props();

	let productInput = $state('');
	let uploadProducts = $state(false);

	const addProductToList = () => {
		productInput = productInput.trim();
		if (!productInput.length) return;
		if (listSet.has(productInput)) {
			addToast(m.idListExists(), 'info');
			productInput = '';
			return;
		}
		listSet.add(productInput);
		onChange?.([ ...listSet ]);
		productInput = '';
	};

	const processIdsFile = (newIds: string[]) => {
		if (!newIds.length) return;
		for (const id of newIds) listSet.add(id);
		onChange?.([ ...listSet ]);
	};

	const removeFromProductList = (id: string) => {
		listSet.delete(id);
		onChange?.([ ...listSet ]);
	};

	const downloadIdsCsv = () => {
		const text = [ ...listSet ].join('\r\n');
		const filename = [ downloadName, dayjs().format('YYYYMMDD') ].join('_') + '.csv';
		const element = document.createElement('a');
		element.setAttribute('href', 'data:text/csv;charset=utf-8,' + encodeURIComponent(text));
		element.setAttribute('download', filename);
		element.style.display = 'none';
		document.body.appendChild(element);
		element.click();
		document.body.removeChild(element);
	};

	const clearList = () => {
		listSet.clear();
		onChange?.([ ...listSet ]);
	};
</script>

<div class="flex-center w-100">
	<form class="flex-center w-100" onsubmit={(e) => { e.preventDefault(); addProductToList(); }}>
		<CustomFormText bind:value={productInput} placeholder={m.productId()} />
		<TooltipSquareIconButton icon="add" hoverText={m.idListAdd()} />
	</form>
	<TooltipSquareIconButton icon="upload" hoverText={m.idListFromFile()} onClick={() => uploadProducts = !uploadProducts} />
	<TooltipSquareIconButton icon="download" hoverText={m.idListCsv()} onClick={downloadIdsCsv} />
	<TooltipSquareIconButton icon="cross-circle" hoverText={m.idListClean()} onClick={clearList} />
</div>

<Collapse isOpen={uploadProducts}>
	<UploadIdsFile onUploaded={processIdsFile} />
</Collapse>

<div class="border border-2 position-relative mb-4 mt-3 position-relative p-3 border-primary rounded">
	<h6 class="position-absolute top-0 start-0 ms-3 mt-n3 px-2 bg-white">{m.idListProducts()} ({ listSet?.size ?? 0 })</h6>
	<div class="ms-2 d-flex flex-wrap">
		{#if listSet?.size}
			<IdList list={listSet} clicked={removeFromProductList} />
		{:else}
			<h6 class="text-center w-100 py-3">{m.idListEmpty()}</h6>
		{/if}
	</div>
</div>