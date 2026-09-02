<script lang="ts">
	import CustomFormText from '$lib/form/CustomFormText.svelte';
	import ClosableModal from '$lib/misc/ClosableModal.svelte';
	import TooltipSquareIconButton from '$lib/misc/TooltipSquareIconButton.svelte';
	import { untrack } from 'svelte';
	import type { PageProps } from './$types';
	import translations from '$lib/documents/handover.translations';
	import IconButton from '$lib/misc/IconButton.svelte';
	import CustomFormTextarea from '$lib/form/CustomFormTextarea.svelte';
	import { confirmSuccess, internal } from '$lib/nav/internal';
	import { wrapLoader } from '$lib/nav/loader';
	import LanguageFlag from '$lib/misc/LanguageFlag.svelte';
	import CustomFormTextTranslate from '$lib/form/CustomFormTextTranslate.svelte';

	let { data }: PageProps = $props();
	let locales: string[] = $state(untrack(() => data.locales));
	let translated: Record<string, DocumentGenerator.HandoverDocumentTranslations> = $state(untrack(() => data.allTranslations));
	let language: string = $state('en');
	let addLocaleModal: boolean = $state(false);
	let newLocale: string = $state('');
	let touched: boolean = $state(false);
	let pasterModal: boolean = $state(false);
	let pasteCode: string = $state('');
	let error = $derived.by(() => {
		if (!touched) return;
		if (newLocale.length === 2 && /[a-zA-Z]{2}/.test(newLocale)) return;
		return 'Kod musi zawierać dwie litery';
	});

	const addLanguage = () => {
		locales.push(newLocale);
		translated[newLocale] = createEmptyObject([ stringKeys, stringArrayKeys ]);
		addLocaleModal = false;
		touched = false;

		setTimeout(() => {
			language = newLocale;
			newLocale = '';
		}, 250);
	};

	type StringKeys<T> = {
		[K in keyof T]-?: NonNullable<T[K]> extends string ? K : never;
	}[keyof T];

	type StringArrayKeys<T> = {
		[K in keyof T]-?: NonNullable<T[K]> extends readonly string[] ? K : never;
	}[keyof T];

	type CategorizedKeys<T> = [StringKeys<T>[], [StringArrayKeys<T>, number][]];

	function splitKeysByValueType<T extends Record<string, any>>(obj: T): CategorizedKeys<T> {
		const stringKeys: StringKeys<T>[] = [];
		const stringArrayCounts: [StringArrayKeys<T>, number][] = [];

		for (const key of Object.keys(obj) as (keyof T)[]) {
			const value = obj[key];

			if (typeof value === 'string') {
				stringKeys.push(key as StringKeys<T>);
			} else if (Array.isArray(value) && value.every((item: any) => typeof item === 'string')) {
				stringArrayCounts.push([ key as StringArrayKeys<T>, value.length ]);
			}
		}

		return [ stringKeys, stringArrayCounts ];
	}

	function createEmptyObject<T extends Record<string, any>>([ stringKeys, stringArrayCounts ]: CategorizedKeys<T>): DocumentGenerator.HandoverDocumentTranslations {
		const result = {} as Record<string, any>;

		for (const key of stringKeys) {
			result[key as string] = '';
		}

		for (const [ key, count ] of stringArrayCounts) {
			result[key as string] = Array<string>(count).fill('');
		}

		return result as DocumentGenerator.HandoverDocumentTranslations;
	}

	const [ stringKeys, stringArrayKeys ] = splitKeysByValueType<DocumentGenerator.HandoverDocumentTranslations>(translations.pl);

	const setPastedCode = () => {
		const obj: Partial<DocumentGenerator.HandoverDocumentTranslations> = JSON.parse(pasteCode);
		for (const key of stringKeys) {
			if (obj[key]) translated[language][key] = obj[key];
		}
		for (const [ key, count ] of stringArrayKeys) {
			if (!obj[key]) continue;
			for (let i = 0; i < count; i++) {
				if (obj[key][i]) translated[language][key][i] = obj[key][i];
			}
		}
		pasterModal = false;
	};

	const saveTranslation = async () => {
		confirmSuccess(wrapLoader(internal.postApi({ translation: translated[language], language }, 'patch')));
	};
</script>

<div class="card mt-3">
	<div class="card-body flex-center flex-wrap">
		{#each locales as locale}
			<button class="btn btn-outline-primary flex-center mx-2 my-1 p-1" class:active={locale === language} disabled={locale === 'pl'} onclick={() => (language = locale)}>
				<LanguageFlag language={locale} size={6} />
			</button>
		{/each}
		<TooltipSquareIconButton icon="add" hoverText="Dodaj język" onClick={() => (addLocaleModal = true)} />
	</div>
	<div class="card-body border-top">
		{#if translated[language]}
			{#each stringKeys as key}
				<CustomFormTextTranslate bind:value={translated[language][key]} caption={translations.pl[key]} targetLocale={language} />
			{/each}
			{#each stringArrayKeys as [ key ]}
				{#each translations.pl[key] as caption, i}
					<CustomFormTextTranslate bind:value={translated[language][key][i]} {caption} targetLocale={language} />
				{/each}
			{/each}
		{/if}
	</div>
	<div class="card-footer justify-content-end d-flex">
		<IconButton icon="edit" size={6} onclick={() => (pasterModal = true)} color="dark" caption="Wklej JSON" class="me-2 mb-0" />
		<IconButton icon="disk" size={6} onclick={saveTranslation} caption="Zapisz" />
	</div>
</div>

<ClosableModal bind:isOpen={addLocaleModal} headerText="Dodaj nowy język" buttonCaption="Dodaj" onClick={addLanguage}>
	<div><p>Aby dodać nowy język do systemu, należy wprowadzić jego oficjalny dwuliterowy kod zgodny ze standardem ISO 639-1 oraz podać pełny adres URL odpowiadającej mu wersji językowej serwisu — wykaz wszystkich identyfikatorów można znaleźć na stronie <a href="https://pl.wikipedia.org/wiki/ISO_639-1">Polskiej Wikipedii</a>.</p></div>
	<form onsubmit={addLanguage}>
		<CustomFormText bind:value={newLocale} onChange={() => (touched = true)} {error} class="text-center" />
	</form>
</ClosableModal>

<ClosableModal bind:isOpen={pasterModal} headerText="Wklej przetłumaczony JSON" buttonCaption="Sprawdź" onClick={setPastedCode}>
	<div><p>Wklej przetłumacony tekst w postaci JSON</p></div>
	<CustomFormTextarea bind:value={pasteCode} />
</ClosableModal>
