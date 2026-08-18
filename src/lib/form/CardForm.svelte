<script lang="ts" generics="T extends Record<string, any>">
	import IconButton from '$lib/misc/IconButton.svelte';
	import { confirmSuccess, internal } from '$lib/nav/internal';
	import { wrapLoader } from '$lib/nav/loader';

	interface Props {
		item: T;
		cleanItem: T;
		name?: string;
		title: string;
		onResponse?: (response: any) => any;
		testData?: () => any;
		children: import('svelte').Snippet<[T]>;
	}

	let { item, cleanItem, title, onResponse, testData, name = 'data', children }: Props = $props();

	const resetForm = () => {
		Object.assign(item, cleanItem);
	};

	const handleSubmit = async (e: Event) => {
		if (e.preventDefault) e.preventDefault();
		const response = await confirmSuccess(wrapLoader(internal.postApi({ [name]: item })));
		if (response.success) onResponse?.(response);
	};
</script>

<div class="card mt-3">
	<h5 class="card-header">{title}</h5>
	<form class="card-body" onsubmit={handleSubmit}>
		{@render children(item)}
	</form>
	<div class="card-footer">
		<div class="d-flex justify-content-end">
			{#if testData}
				<IconButton icon="undo" caption="Testowe dane" onclick={testData} color="dark" size={6} class="me-2 mb-0" />
			{/if}
			<IconButton icon="undo" caption="Resetuj" outline onclick={resetForm} color="dark" size={6} />
			<IconButton icon="disk" caption="Zapisz" onclick={handleSubmit} size={6} class="ms-2 mb-0" />
		</div>
	</div>
</div>
