<script lang="ts" generics="T extends Driver.NewDriverData | Driver.Driver">
	import CustomFormTextarea from '$lib/form/CustomFormTextarea.svelte';
	import CardForm from '$lib/form/CardForm.svelte';
	import CustomFormText from '$lib/form/CustomFormText.svelte';
	import CustomFormRadio from '$lib/form/CustomFormRadio.svelte';
	import licensesRaw from '$lib/assets/data/licenses.json';
	import { addToast } from '$lib/toast';
	import CustomFormSelect from '$lib/form/CustomFormSelect.svelte';
	import CustomFormDate from '$lib/form/CustomFormDate.svelte';
	import { fly, slide } from 'svelte/transition';
	import { flip } from 'svelte/animate';
	import { list } from '$lib/assets/data/markets.json';
	import { identificationDocumentNames, languages } from '$lib/assets/constants';
	import CustomFormLanguage from '$lib/form/CustomFormLanguage.svelte';
	import AbsoluteRemoveButton from '$lib/misc/AbsoluteRemoveButton.svelte';
	import CustomFormCountry from '$lib/form/CustomFormCountry.svelte';
	import type { ZodType } from 'zod';
	import type { Snippet } from 'svelte';
	import { transliterate } from 'transliteration';

	interface Props {
		item: T;
		cleanItem: T;
		name?: string;
		onResponse?: (response: any, item: T) => any;
		onReset?: () => any;
		testData?: () => any;
		beforeSubmit?: (obj: T) => Partial<T>;
		schema?: ZodType<T>;
		patch?: boolean;
		submitSnippet?: Snippet<[{ isValid: boolean, errors: Partial<Record<keyof T, string>>; touchAll: () => void }]>;
		footer?: Snippet;
	}

	let { item = $bindable(), cleanItem, name = 'data', onResponse, onReset, testData, beforeSubmit, schema, patch, submitSnippet, footer }: Props = $props();

	const licenses = licensesRaw.categories.reduce(
		(obj, item) => {
			obj[item.code] = `${item.code}: ${item.name}`;
			return obj;
		},
		{ '': 'Wybierz kategorię', taxi: 'Uprawnienia do kierowania taksówką' } as Record<string, string>
	);

	const languageNames = languages.reduce(
		(obj, item) => {
			obj[item[0]] = [ item[2], item[3] ].join(' / ');
			return obj;
		},
		{} as Record<string, string>
	);

	let languageToAdd: string = $state('en');
	let additionalLanguageKeys = $derived(Object.keys(item.additionalLanguages || {}));

	export const addDrivingLicense = (type: string, silent = false) => {
		if (type === 'taxi') {
			if (item.taxiAuthorization) {
				if (!silent) addToast('Takie uprawnienie zostało już dodane');
				return;
			}
			const date = new Date().toLocaleDateString('en-CA');
			item.taxiAuthorization = {
				expirationDate: date,
				market: 'WAW',
				registryEntryNumber: ''
			};
			return;
		}

		if (!licenses[type]) return addToast('Niepoprawny rodzaj prawa jazdy');
		if (item.drivingLicenses.some((license: Driver.DrivingLicense) => license.category === type)) return addToast('Takie uprawnienie zostało już dodane');
		const date = new Date().toLocaleDateString('en-CA');
		item.drivingLicenses.push({
			category: type as Driver.DrivingLicenseCategory,
			expirationDate: date,
			number: '',
			issuingCountry: 'PL'
		});
	};

	const removeDrivingLicense = (type: string) => {
		if (type === 'taxi') {
			item.taxiAuthorization = undefined;
			return;
		}
		const category = type as Driver.DrivingLicenseCategory;
		item.drivingLicenses = item.drivingLicenses.filter((license: Driver.DrivingLicense) => {
			return license.category !== category;
		});
	};

	const addLanguage = () => {
		if (!languageToAdd.length) return;
		if (!item.additionalLanguages) item.additionalLanguages = {};
		if (item.additionalLanguages[languageToAdd]) return addToast('Ten język już jest dodany');
		item.additionalLanguages[languageToAdd] = 'fluent';
	};

	const removeLanguage = (language: string) => {
		if (item.additionalLanguages) delete item.additionalLanguages[language];
	};

	const addLanguageByCountry = (countryCode: string) => {
		if (countryCode === 'pl') {
			item.polishLanguage = 'native';
			return;
		}
		const language = languages.find((lang) => lang[1] === countryCode);
		if (language) {
			if (!item.additionalLanguages) item.additionalLanguages = {};
			item.additionalLanguages[language[0]] = 'native';
		}
	};

	const handleBeforeSubmit = (obj: T): Partial<T> => {
		const updates: any = {};
		
		updates.preferredLanguage = 'pl';
		if (obj.polishLanguage === 'basic') {
			const other = Object.keys(obj.additionalLanguages || {});
			if (other.length) updates.preferredLanguage = other[0] as App.Locale;
		}

		const tl: Array<keyof Driver.NewDriverData> = [ 'name' ];
		tl.forEach(field => {
			if (obj[field]) {
				updates[field] = transliterate(obj[field] as string);
			}
		});

		let customUpdates = {};
		if (beforeSubmit) {
			customUpdates = beforeSubmit(obj);
		}

		return { ...updates, ...customUpdates };
	}

</script>

<CardForm {item} {cleanItem} {name} {onResponse} {onReset} {testData} beforeSubmit={handleBeforeSubmit} {schema} {patch} {submitSnippet} {footer}>
	{#snippet children({ errors, touch })}
		<div class="row">
			<div class="col-12 col-md-6">
				<section class="mb-3">
					<h5>Podstawowe informacje</h5>
					<div>
						<CustomFormText bind:value={item.name} caption="Imię i nazwisko" error={errors.name} onblur={() => touch('name')} />
						<CustomFormText bind:value={item.pesel} caption="PESEL" error={errors.pesel} onblur={() => touch('pesel')} readonly={patch} />
						<CustomFormSelect caption="Rodzaj dokumentu tożsamości" bind:value={item.identificationDocumentType} list={identificationDocumentNames} size={6} />
						<CustomFormText bind:value={item.identificationDocumentNumber} caption="Numer dokumentu tożsamości" error={errors.identificationDocumentNumber} onblur={() => touch('identificationDocumentNumber')} />
						<label for="sexSelect">Płeć</label>
						<div class="d-flex small">
							<CustomFormRadio bind:selected={item.sex} name="sexSelect" value="m" caption="Mężczyzna" class="me-5" />
							<CustomFormRadio bind:selected={item.sex} name="sexSelect" value="f" caption="Kobieta" class="me-5" />
							<CustomFormRadio bind:selected={item.sex} name="sexSelect" value="o" caption="Inna" />
						</div>
						<label for="plLanguage">Narodowość</label>
						<CustomFormCountry bind:value={item.nationality} onchange={addLanguageByCountry} />
						<label for="plLanguage">Język polski</label>
						<div class="d-flex small">
							<CustomFormRadio bind:selected={item.polishLanguage} name="languageSelect" value="basic" caption="Podstawowy" class="me-5" />
							<CustomFormRadio bind:selected={item.polishLanguage} name="languageSelect" value="fluent" caption="Biegły" class="me-5" />
							<CustomFormRadio bind:selected={item.polishLanguage} name="languageSelect" value="native" caption="Ojczysty" class="me-5" />
						</div>
						<label for="addLanguage">Dodatkowe języki</label>
						{#if errors.additionalLanguages}
							<div class="xsmall text-danger" transition:slide>{errors.additionalLanguages}</div>
						{/if}
						<ul>
							{#each additionalLanguageKeys as language}
								<li class="d-flex small position-relative">
									<AbsoluteRemoveButton color="dark" onclick={() => removeLanguage(language)} />
									<div class="w-50">
										{languageNames[language] || language}
									</div>
									{#if item.additionalLanguages}
										<CustomFormRadio bind:selected={item.additionalLanguages[language]} name="languageSelect{language}" value="fluent" caption="Biegły" class="me-5" />
										<CustomFormRadio bind:selected={item.additionalLanguages[language]} name="languageSelect{language}" value="native" caption="Ojczysty" class="me-5" />
									{/if}
								</li>
							{/each}
						</ul>
						<div class="row">
							<div class="col-8">
								<CustomFormLanguage bind:value={languageToAdd} />
							</div>
							<div class="col-4">
								<button class="btn btn-primary btn-sm w-100" type="button" onclick={() => addLanguage()}> Dodaj język </button>
							</div>
						</div>
					</div>
				</section>
			</div>

			<div class="col-12 col-md-6">
				<section class="mb-3">
					<h5>Kontakt</h5>
					<div>
						<CustomFormText bind:value={item.phone} caption="Numer telefonu" error={errors.phone} onblur={() => touch('phone')} />
						<CustomFormText bind:value={item.email} caption="Adres E-mail" error={errors.email} onblur={() => touch('email')} />
						<CustomFormText bind:value={item.address} caption="Adres" error={errors.address} onblur={() => touch('address')} />
					</div>
				</section>
				<section class="mb-3">
					<h5>Licencje i pozwolenia</h5>
					<div>
						<CustomFormSelect caption="Wybierz kategorię pozwolenia z listy aby dodać" list={licenses} onchange={addDrivingLicense} size={6} class="mb-3" />
						{#if item.taxiAuthorization}
							<div class="border border-dark rounded mb-3 p-3 position-relative" transition:fly>
								<AbsoluteRemoveButton color="dark" onclick={() => removeDrivingLicense('taxi')} />
								<div class="small">Uprawnienie do prowadzenia <b class="text-dark">Taxi</b></div>
								<CustomFormText bind:value={item.taxiAuthorization.registryEntryNumber} caption="Numer pozwolenia" error={errors.taxiAuthorization} onblur={() => touch('taxiAuthorization')} />
								<CustomFormSelect {list} bind:value={item.taxiAuthorization.market} caption="Obszar" class="mb-3" size={6} />
								<CustomFormDate bind:value={item.taxiAuthorization.expirationDate} caption="Data ważności" />
							</div>
						{/if}
						<div class="mt-3">
							{#each item.drivingLicenses as license (license.category)}
								<div class="border border-dark rounded mb-3 p-3 position-relative" transition:fly animate:flip>
									<AbsoluteRemoveButton color="dark" onclick={() => removeDrivingLicense(license.category)} />
									<div class="small">Uprawnienie kategorii: <b class="text-dark">{licenses[license.category]}</b></div>
									<div class="row">
										<div class="col-6">
											<CustomFormText bind:value={license.number} caption="Numer prawa jazdy" error={errors.drivingLicenses} onblur={() => touch('drivingLicenses')} />
										</div>
										<div class="col-6">
											<CustomFormDate bind:value={license.expirationDate} caption="Data ważności" />
										</div>
									</div>
								</div>
							{/each}
						</div>
					</div>
				</section>
			</div>
		</div>
		<CustomFormTextarea bind:value={item.notes} caption="Notatka" />
	{/snippet}
</CardForm>
