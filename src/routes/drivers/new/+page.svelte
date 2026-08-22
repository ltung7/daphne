<script lang="ts">
	import CustomFormTextarea from '$lib/form/CustomFormTextarea.svelte';
	import { cleanDriver } from '$lib/assets/cleanItems';
	import CardForm from '$lib/form/CardForm.svelte';
	import CustomFormText from '$lib/form/CustomFormText.svelte';
	import CustomFormRadio from '$lib/form/CustomFormRadio.svelte';
	import licensesRaw from '$lib/assets/data/licenses.json';
	import { addToast } from '$lib/toast';
	import CustomFormSelect from '$lib/form/CustomFormSelect.svelte';
	import TooltipSquareIconButton from '$lib/misc/TooltipSquareIconButton.svelte';
	import CustomFormDate from '$lib/form/CustomFormDate.svelte';
	import { onMount } from 'svelte';
	import { fly } from 'svelte/transition';
	import { flip } from 'svelte/animate';
	import { list } from '$lib/assets/data/markets.json';
	import ClosableModal from '$lib/misc/ClosableModal.svelte';
	import { goto } from '$app/navigation';
	import { Faker, uk, ne, en, cs_CZ as cs, fakerPL } from '@faker-js/faker';
	import { identificationDocumentNames } from '$lib/assets/constants';

	const licenses = licensesRaw.categories.reduce(
		(obj, item) => {
			obj[item.code] = `${item.code}: ${item.name}`;
			return obj;
		},
		{ '': 'Wybierz kategorię', taxi: 'Uprawnienia do kierowania taksówką' } as Record<string, string>
	);

	let driver: Driver.NewDriverData = $state({ ...cleanDriver });
	let createdId: string | undefined = $state();
	let createdPassword: string | undefined = $state();
	let showCreated = $state(false);

	const onResponse = async (response: any) => {
		if (response.id) createdId = response.id;
		if (response.password) createdPassword = response.password;
		showCreated = true;
	};

	const onReset = () => {
		addDrivingLicense('B');
		addDrivingLicense('taxi');
	};

	const addDrivingLicense = (type: string) => {
		if (type === 'taxi') {
			if (driver.taxiAuthorization) return addToast('Takie uprawnienie zostało już dodane');
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
			phone: fakerPL.phone.number().replace(/\s/g, ''),
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

<CardForm title="Nowy kierowca" item={driver} cleanItem={cleanDriver} {onResponse} {onReset} {testData}>
	<div class="row">
		<div class="col-12 col-md-6">
			<section class="mb-3">
				<h5>Podstawowe informacje</h5>
				<div>
					<CustomFormText bind:value={driver.name} caption="Imię i nazwisko" />
					<CustomFormText bind:value={driver.login} caption="Login" />
					<CustomFormSelect caption="Rodzaj dokumentu tożsamości" bind:value={driver.identificationDocumentType} list={identificationDocumentNames} size={6} />
					<CustomFormText bind:value={driver.identificationDocumentNumber} caption="Numer dokumentu tożsamości" />
					<label for="sexSelect">Płeć</label>
					<div class="d-flex small">
						<CustomFormRadio bind:selected={driver.sex} name="sexSelect" value="m" caption="Mężczyzna" class="me-5" />
						<CustomFormRadio bind:selected={driver.sex} name="sexSelect" value="f" caption="Kobieta" class="me-5" />
						<CustomFormRadio bind:selected={driver.sex} name="sexSelect" value="o" caption="Inna" />
					</div>
					<label for="plLanguage">Język polski</label>
					<div class="d-flex small">
						<CustomFormRadio bind:selected={driver.polishLanguage} name="languageSelect" value="basic" caption="Podstawowy" class="me-5" />
						<CustomFormRadio bind:selected={driver.polishLanguage} name="languageSelect" value="fluent" caption="Biegły" class="me-5" />
						<CustomFormRadio bind:selected={driver.polishLanguage} name="languageSelect" value="native" caption="Ojczysty" class="me-5" />
					</div>
					<label for="addLanguage">Dodatkowe języki</label>
					{#each Object.keys(driver.additionalLanguages) as language}
						<div class="d-flex small">
							<CustomFormRadio bind:selected={driver.additionalLanguages[language]} name="languageSelect{language}" value="fluent" caption="Biegły" class="me-5" />
							<CustomFormRadio bind:selected={driver.additionalLanguages[language]} name="languageSelect{language}" value="native" caption="Ojczysty" class="me-5" />
						</div>
					{/each}
					<div>
						<button class="btn btn-primary btn-sm" type="button"> Dodaj język </button>
					</div>
				</div>
			</section>
		</div>

		<div class="col-12 col-md-6">
			<section class="mb-3">
				<h5>Kontakt</h5>
				<div>
					<CustomFormText bind:value={driver.phone} caption="Numer telefonu" />
					<CustomFormText bind:value={driver.email} caption="Adres E-mail" />
					<CustomFormText bind:value={driver.address} caption="Adres" />
				</div>
			</section>
			<section class="mb-3">
				<h5>Licencje i pozwolenia</h5>
				<div>
					<CustomFormSelect caption="Wybierz kategorię pozwolenia z listy aby dodać" list={licenses} onchange={addDrivingLicense} size={6} class="mb-3" />
					{#if driver.taxiAuthorization}
						<div class="border border-dark rounded mb-3 p-2 position-relative" transition:fly>
							<div class="position-absolute end-0 top-0">
								<TooltipSquareIconButton icon="cross-circle" hoverText="Usuń" color="dark" size={6} onClick={() => removeDrivingLicense('taxi')} />
							</div>
							<div class="small">Uprawnienie do prowadzenia <b class="text-dark">Taxi</b></div>
							<CustomFormText bind:value={driver.taxiAuthorization.registryEntryNumber} caption="Numer pozwolenia" />
							<CustomFormSelect {list} bind:value={driver.taxiAuthorization.market} caption="Obszar" class="mb-3" size={6} />
							<CustomFormDate bind:value={driver.taxiAuthorization.expirationDate} caption="Data ważności" />
						</div>
					{/if}
					<div class="mt-3">
						{#each driver.drivingLicenses as license (license.category)}
							<div class="border border-dark rounded mb-3 p-2 position-relative" transition:fly animate:flip>
								<div class="position-absolute end-0 top-0">
									<TooltipSquareIconButton icon="cross-circle" hoverText="Usuń" color="dark" size={6} onClick={() => removeDrivingLicense(license.category)} />
								</div>
								<div class="small">Uprawnienie kategorii: <b class="text-dark">{licenses[license.category]}</b></div>
								<div class="row">
									<div class="col-6">
										<CustomFormText bind:value={license.number} caption="Numer prawa jazdy" />
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
