<script lang="ts">
	import { endLoad, startLoad } from '$lib/nav/loader';
	import { addToast } from '$lib/toast';
	import UploadDatafilesComponent, { type DataFilesType, type DataFilePreprocessResult, type DataFilesDescriptor } from 'upload-datafiles-comp';
	import { createEventDispatcher } from 'svelte';
	type T = $$Generic<DataFilesDescriptor>;
	const dispatch = createEventDispatcher<{
		processed: DataFilePreprocessResult;
	}>();
	export let datafiles: DataFilesType<T>,
		account: string | undefined,
		uploadCopy: boolean | ((_s: string) => boolean) | string[] = false;

	const handleProcessed = (e: CustomEvent<DataFilePreprocessResult>) => {
		endLoad()
		dispatch('processed', e.detail);
	};
</script>

<UploadDatafilesComponent
	{datafiles}
	extraData={account}
	on:processed={handleProcessed}
	on:start={startLoad}
	on:error={(e) => {
		addToast(e.detail);
		endLoad();
	}}
	{uploadCopy}
	containerClasses="border border-dashed bg-light border-white border-radius-xl w-100 p-4 flex-center flex-column border-2 position-relative overflow-hidden text-dark"
/>
