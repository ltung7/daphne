<script lang="ts" generics="T extends Record<string, any>">
	import IconButton from '$lib/misc/IconButton.svelte';
	import { confirmSuccess, internal } from '$lib/nav/internal';
	import { wrapLoader } from '$lib/nav/loader';
	import { tick, type Snippet } from 'svelte';
	import type { ZodType } from 'zod';

	interface Props {
		item: T;
		cleanItem: T;
		name?: string;
		title: string;
		onResponse?: (response: any) => any;
		onReset?: () => any;
		testData?: () => any;
		beforeSubmit?: (obj: T) => Partial<T>;
		schema?: ZodType<T>;
		footer?: Snippet;
		submitSnippet?: Snippet<[{ isValid: boolean, errors: Partial<Record<keyof T, string>>; touchAll: () => void }]>;
		children: Snippet<
			[
				{
					errors: Partial<Record<keyof T, string>>;
					allErrors: Partial<Record<keyof T, string>>;
					isValid: boolean;
					touch: (field: keyof T) => void;
				}
			]
		>;
	}

	let { item, cleanItem, title, onReset, submitSnippet, onResponse, beforeSubmit, testData, name = 'data', children, schema, footer }: Props = $props();

	let touched = $state<Partial<Record<keyof T, boolean>>>({});

	const resetForm = () => {
		Object.assign(item, cleanItem);
		touched = {};
		onReset?.();
	};

	const handleSubmit = async (e: Event) => {
		if (e.preventDefault) e.preventDefault();
		touchAll();
		if (beforeSubmit) {
			const newValues = beforeSubmit(item);
			Object.assign(item, newValues)
		}
		await tick();
		
		if (!isValid) {
			console.log(errors)
			return false;
		}
		const response = await confirmSuccess(wrapLoader(internal.postApi({ [name]: item })));
		if (response.success) onResponse?.(response);
	};

	let errors = $derived.by((): Partial<Record<keyof T, string>> => {
		if (!schema) return {};
		const result = schema.safeParse(item);
		if (result.success) return {};
		const map: Partial<Record<keyof T, string>> = {};
		for (const issue of result.error.issues) {
			const key = issue.path[0] as keyof T;
			if (!(key in map)) map[key] = issue.message;
		}
		return map;
	});

	let visibleErrors = $derived.by((): Partial<Record<keyof T, string>> => {
		const out: Partial<Record<keyof T, string>> = {};
		for (const key in errors) {
			if (touched[key]) out[key] = errors[key];
		}
		return out;
	});

	let isValid = $derived(Object.keys(errors).length === 0);

	function touch(field: keyof T) {
		touched[field] = true;
	}

	function touchAll() {
		for (const key of Object.keys(item) as (keyof T)[]) touched[key] = true;
	}
</script>

<div class="card mt-3">
	<h5 class="card-header">{title}</h5>
	<form class="card-body" onsubmit={handleSubmit}>
		{@render children({ errors: visibleErrors, allErrors: errors, isValid, touch })}
	</form>
	<div class="card-footer">
		<div class="d-flex justify-content-end">
			{#if footer}
				{@render footer()}
			{/if}
			{#if testData}
				<IconButton icon="undo" caption="Testowe dane" onclick={testData} color="dark" size={6} class="me-2 mb-0" />
			{/if}
			<IconButton icon="undo" caption="Resetuj" outline onclick={resetForm} color="dark" size={6} />
			{#if submitSnippet}
				{@render submitSnippet({ isValid, errors, touchAll })}
			{:else}
				<IconButton icon="disk" caption="Zapisz" onclick={handleSubmit} size={6} class="ms-2 mb-0" />
			{/if}
		</div>
	</div>
</div>
