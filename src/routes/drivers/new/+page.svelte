<script lang="ts">
	import CustomFormTextarea from '$lib/form/CustomFormTextarea.svelte';
	import { cleanDriver } from '$lib/assets/cleanItems';
	import CardForm from '$lib/form/CardForm.svelte';
	import CustomFormText from '$lib/form/CustomFormText.svelte';
	import CustomFormRadio from '$lib/form/CustomFormRadio.svelte';
	import licensesRaw from '$lib/assets/data/licenses.json';
	import { addToast } from '$lib/toast';
	import CustomFormSelect from '$lib/form/CustomFormSelect.svelte';
	import CustomFormDate from '$lib/form/CustomFormDate.svelte';
	import { onMount } from 'svelte';
	import { fly, slide } from 'svelte/transition';
	import { flip } from 'svelte/animate';
	import { list } from '$lib/assets/data/markets.json';
	import ClosableModal from '$lib/misc/ClosableModal.svelte';
	import { goto } from '$app/navigation';
	import { Faker, uk, ne, en, cs_CZ as cs, fakerPL } from '@faker-js/faker';
	import { identificationDocumentNames, languages } from '$lib/assets/constants';
	import CustomFormLanguage from '$lib/form/CustomFormLanguage.svelte';
	import AbsoluteRemoveButton from '$lib/misc/AbsoluteRemoveButton.svelte';
	import { newDriverDataSchema } from '$lib/assets/zodschemas/newdriver.schema';
	import randomNumber from '$lib/utils/randomNumber';
	import CustomFormCountry from '$lib/form/CustomFormCountry.svelte';

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

	let driver: Driver.NewDriverData = $state({ ...cleanDriver });
	let createdId: string | undefined = $state();
	let createdPassword: string | undefined = $state();
	let showCreated = $state(false);
	let languageToAdd: string = $state('en');
	let additionalLanguageKeys = $derived(Object.keys(driver.additionalLanguages));

	const onResponse = async (response: any) => {
		if (response.id) createdId = response.id;
		if (response.password) createdPassword = response.password;
		showCreated = true;
	};

	const onReset = () => {
		addDrivingLicense('B', true);
		addDrivingLicense('taxi', true);
	};

	const addDrivingLicense = (type: string, silent = false) => {
		if (type === 'taxi') {
			if (driver.taxiAuthorization) {
				if (!silent) addToast('Takie uprawnienie zostało już dodane');
				return;
			}
			const date = new Date().toLocaleDateString('en-CA');
			driver.taxiAuthorization = {
				expirationDate: date,
				market: 'WAW',
				registryEntryNumber: ''
			};
			return;
		}

		if (!licenses[type]) return addToast('Niepoprawny rodzaj prawa jazdy');
		if (driver.drivingLicenses.some((item) => item.category === type)) return addToast('Takie uprawnienie zostało już dodane');
		const date = new Date().toLocaleDateString('en-CA');
		driver.drivingLicenses.push({
			category: type as Driver.DrivingLicenseCategory,
			expirationDate: date,
			number: '',
			issuingCountry: 'PL'
		});
	};

	const removeDrivingLicense = (type: string) => {
		if (type === 'taxi') {
			driver.taxiAuthorization = undefined;
			return;
		}
		const category = type as Driver.DrivingLicenseCategory;
		driver.drivingLicenses = driver.drivingLicenses.filter((item) => {
			return item.category !== category;
		});
	};

	const addLanguage = () => {
		if (!languageToAdd.length) return;
		if (driver.additionalLanguages[languageToAdd]) return addToast('Ten język już jest dodany');
		driver.additionalLanguages[languageToAdd] = 'fluent';
	};

	const removeLanguage = (language: string) => {
		delete driver.additionalLanguages[language];
	};

	const addLanguageByCountry = (countryCode: string) => {
		if (countryCode === 'pl') {
			driver.polishLanguage = 'native';
			return;
		}
		const language = languages.find((item) => item[1] === countryCode);
		if (language) {
			driver.additionalLanguages[language[0]] = 'native';
		}
	};

	onMount(onReset);

	const testData = () => {
		const availableLocales = [ uk, ne, en, cs ];
		const selectedLocale = availableLocales[Math.floor(Math.random() * availableLocales.length)];
		const localeCode = selectedLocale.metadata?.code as string;
		const faker = new Faker({ locale: selectedLocale });

		const sex = faker.helpers.arrayElement([ 'm', 'f' ] as const);
		const fakerSex = sex === 'm' ? 'male' : 'female';

		const firstName = faker.person.firstName(fakerSex);
		const lastName = faker.person.lastName(fakerSex);
		const fullName = `${firstName} ${lastName}`;

		const emailLocalPart = faker.internet
			.username({ firstName, lastName })
			.toLowerCase()
			.replace(/[^a-z0-9]/g, '');
		const email = `${emailLocalPart}@mail.pl`;
		const address = `${fakerPL.location.streetAddress()}, ${faker.location.zipCode()}, ${fakerPL.location.city()}`;
		const nationality = localeCode === 'uk' ? 'UA' : localeCode === 'ne' ? 'NP' : localeCode === 'en' ? 'GB' : localeCode === 'cs' ? 'CZ' : 'PL';
		const drivingLicenseExpiry = new Date(Date.now() + (Math.random() * (365 * 2 - 365) + 365) * 24 * 60 * 60 * 1000).toISOString().substring(0, 10);
		const taxiExpiry = new Date(Date.now() + (Math.random() * (365 * 3 - 365) + 365) * 24 * 60 * 60 * 1000).toISOString().substring(0, 10);
		const phone = faker.helpers.arrayElement([ 45, 50, 51, 60, 66, 69, 72, 79, 88 ]).toString() + randomNumber(1000000, 9999999);

		driver = {
			address,
			drivingLicenses: [
				{
					category: 'B',
					expirationDate: drivingLicenseExpiry,
					issuingCountry: 'PL',
					number: faker.string.alphanumeric(10).toUpperCase()
				}
			],
			email,
			login: emailLocalPart,
			name: fullName,
			phone,
			polishLanguage: 'basic',
			identificationDocumentType: 'passport',
			identificationDocumentNumber: faker.string.alphanumeric(10).toUpperCase(),
			nationality,
			additionalLanguages: {
				[localeCode as string]: 'native'
			},
			sex,
			notes: `Test ${faker.number.int({ min: 10000, max: 99999 })}`,
			id: '',
			taxiAuthorization: {
				expirationDate: taxiExpiry,
				market: 'WAW',
				registryEntryNumber: faker.string.alphanumeric(10).toUpperCase()
			}
		};
	};
</script>

<svelte:head>
	<title>Nowy kierowca</title>
</svelte:head>

<CardForm title="Nowy kierowca" item={driver} cleanItem={cleanDriver} {onResponse} {onReset} {testData} schema={newDriverDataSchema}>
	{#snippet children({ errors, touch })}
		<div class="row">
			<div class="col-12 col-md-6">
				<section class="mb-3">
					<h5>Podstawowe informacje</h5>
					<div>
						<CustomFormText bind:value={driver.name} caption="Imię i nazwisko" error={errors.name} onblur={() => touch('name')} />
						<CustomFormText bind:value={driver.login} caption="Login" error={errors.login} onblur={() => touch('login')} />
						<CustomFormSelect caption="Rodzaj dokumentu tożsamości" bind:value={driver.identificationDocumentType} list={identificationDocumentNames} size={6} />
						<CustomFormText bind:value={driver.identificationDocumentNumber} caption="Numer dokumentu tożsamości" error={errors.identificationDocumentNumber} onblur={() => touch('identificationDocumentNumber')} />
						<label for="sexSelect">Płeć</label>
						<div class="d-flex small">
							<CustomFormRadio bind:selected={driver.sex} name="sexSelect" value="m" caption="Mężczyzna" class="me-5" />
							<CustomFormRadio bind:selected={driver.sex} name="sexSelect" value="f" caption="Kobieta" class="me-5" />
							<CustomFormRadio bind:selected={driver.sex} name="sexSelect" value="o" caption="Inna" />
						</div>
						<label for="plLanguage">Narodowość</label>
						<CustomFormCountry bind:value={driver.nationality} onchange={addLanguageByCountry} />
						<label for="plLanguage">Język polski</label>
						<div class="d-flex small">
							<CustomFormRadio bind:selected={driver.polishLanguage} name="languageSelect" value="basic" caption="Podstawowy" class="me-5" />
							<CustomFormRadio bind:selected={driver.polishLanguage} name="languageSelect" value="fluent" caption="Biegły" class="me-5" />
							<CustomFormRadio bind:selected={driver.polishLanguage} name="languageSelect" value="native" caption="Ojczysty" class="me-5" />
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
										{languageNames[language]}
									</div>
									<CustomFormRadio bind:selected={driver.additionalLanguages[language]} name="languageSelect{language}" value="fluent" caption="Biegły" class="me-5" />
									<CustomFormRadio bind:selected={driver.additionalLanguages[language]} name="languageSelect{language}" value="native" caption="Ojczysty" class="me-5" />
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
						<CustomFormText bind:value={driver.phone} caption="Numer telefonu" error={errors.phone} onblur={() => touch('phone')} />
						<CustomFormText bind:value={driver.email} caption="Adres E-mail" error={errors.email} onblur={() => touch('email')} />
						<CustomFormText bind:value={driver.address} caption="Adres" error={errors.address} onblur={() => touch('address')} />
					</div>
				</section>
				<section class="mb-3">
					<h5>Licencje i pozwolenia</h5>
					<div>
						<CustomFormSelect caption="Wybierz kategorię pozwolenia z listy aby dodać" list={licenses} onchange={addDrivingLicense} size={6} class="mb-3" />
						{#if driver.taxiAuthorization}
							<div class="border border-dark rounded mb-3 p-2 position-relative" transition:fly>
								<AbsoluteRemoveButton color="dark" onclick={() => removeDrivingLicense('taxi')} />
								<div class="small">Uprawnienie do prowadzenia <b class="text-dark">Taxi</b></div>
								<CustomFormText bind:value={driver.taxiAuthorization.registryEntryNumber} caption="Numer pozwolenia" error={errors.taxiAuthorization} onblur={() => touch('taxiAuthorization')} />
								<CustomFormSelect {list} bind:value={driver.taxiAuthorization.market} caption="Obszar" class="mb-3" size={6} />
								<CustomFormDate bind:value={driver.taxiAuthorization.expirationDate} caption="Data ważności" />
							</div>
						{/if}
						<div class="mt-3">
							{#each driver.drivingLicenses as license (license.category)}
								<div class="border border-dark rounded mb-3 p-2 position-relative" transition:fly animate:flip>
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
		<CustomFormTextarea bind:value={driver.notes} caption="Notatka" />
	{/snippet}
</CardForm>

<ClosableModal bind:isOpen={showCreated} headerText="Kierowaca dodany" buttonCaption={createdId?.length ? 'Przejdź' : false} onClick={() => createdId && goto('/drivers/' + createdId)}>
	<div class="text-center">
		<h5 class="text-success">Kierowaca został dodany</h5>
		<div class="fw-bold">Wygenerowane hasło to:</div>
		<div class="mt-3 border p-3 fs-6 text-dark">
			{createdPassword || ''}
		</div>
	</div>
</ClosableModal>
