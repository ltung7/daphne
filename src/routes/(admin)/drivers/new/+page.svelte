<script lang="ts">
	import { cleanDriver } from '$lib/assets/cleanItems';
	import { onMount } from 'svelte';
	import IconLink from '$lib/misc/IconLink.svelte';
	import PageTitle from '$lib/misc/PageTitle.svelte';
	import ClosableModal from '$lib/misc/ClosableModal.svelte';
	import { goto } from '$app/navigation';
	import { Faker, uk, ne, en, pl, fakerPL } from '@faker-js/faker';
	import { newDriverDataSchema } from '$lib/assets/zodschemas/newdriver.zod';
	import randomNumber from '$lib/utils/randomNumber';
	import { transliterate } from 'transliteration';
	import DriverForm from '$lib/components/driver/DriverForm.svelte';

	let driver: Driver.NewDriverData = $state({ ...cleanDriver });
	let createdId: string | undefined = $state();
	let createdPassword: string | undefined = $state();
	let showCreated = $state(false);

	let driverFormRef: ReturnType<typeof DriverForm> | undefined = $state();

	const onResponse = async (response: any) => {
		if (response.id) createdId = response.id;
		if (response.password) createdPassword = response.password;
		showCreated = true;
	};

	const onReset = () => {
		if (driverFormRef) {
			driverFormRef.addDrivingLicense('B', true);
			driverFormRef.addDrivingLicense('taxi', true);
		}
	};

	onMount(() => {
		// Using a small timeout to ensure child component is mounted
		setTimeout(onReset, 0);
	});

	const testData = () => {
		const availableLocales = [ uk, ne, en, pl ];
		const selectedLocale = availableLocales[Math.floor(Math.random() * availableLocales.length)];
		const localeCode = (selectedLocale.metadata?.code as string).slice(0, 2);
		const faker = new Faker({ locale: selectedLocale });

		const sex = faker.helpers.arrayElement([ 'm', 'f' ] as const);
		const fakerSex = sex === 'm' ? 'male' : 'female';

		const firstName = faker.person.firstName(fakerSex);
		const lastName = faker.person.lastName(fakerSex);
		const fullName = `${firstName} ${lastName}`;

		const emailLocalPart = transliterate([ firstName, lastName, randomNumber(10, 999) ].join('')).toLowerCase();
		const email = `${emailLocalPart}@mail.pl`;
		const address = `${fakerPL.location.streetAddress()}, ${faker.location.zipCode()}, ${fakerPL.location.city()}`;
		const nationality = localeCode === 'uk' ? 'ua' : localeCode === 'ne' ? 'np' : localeCode === 'en' ? 'gb' : localeCode === 'cs' ? 'cz' : 'pl';
		const drivingLicenseExpiry = new Date(Date.now() + (Math.random() * (365 * 2 - 365) + 365) * 24 * 60 * 60 * 1000).toISOString().substring(0, 10);
		const taxiExpiry = new Date(Date.now() + (Math.random() * (365 * 3 - 365) + 365) * 24 * 60 * 60 * 1000).toISOString().substring(0, 10);
		const phone = faker.helpers.arrayElement([ 45, 50, 51, 60, 66, 69, 72, 79, 88 ]).toString() + randomNumber(1000000, 9999999);

		const additionalLanguages: Record<string, 'native'> = {}
		if (localeCode !== 'pl') additionalLanguages[localeCode] = 'native';

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
			name: fullName,
			pesel: randomNumber(10000000000, 99999999999).toString(),
			phone,
			polishLanguage: 'basic',
			identificationDocumentType: 'passport',
			identificationDocumentNumber: faker.string.alphanumeric(10).toUpperCase(),
			nationality,
			additionalLanguages,
			sex,
			notes: `Test ${faker.number.int({ min: 10000, max: 99999 })}`,
			id: '',
			preferredLanguage: 'en', // TODO: Automate
			taxiAuthorization: {
				expirationDate: taxiExpiry,
				market: 'WAW',
				registryEntryNumber: faker.string.alphanumeric(10).toUpperCase()
			}
		};
	};
</script>

<PageTitle title="Nowy kierowca" subtitle="Wprowadź dane nowego kierowcy do systemu">
	<IconLink icon="left" caption="Powrót do listy" href="/drivers" />
</PageTitle>

<DriverForm bind:item={driver} bind:this={driverFormRef} cleanItem={cleanDriver} {onResponse} {onReset} {testData} schema={newDriverDataSchema} />

<ClosableModal bind:isOpen={showCreated} headerText="Kierowaca dodany" buttonCaption={createdId?.length ? 'Przejdź' : false} onClick={() => createdId && goto('/drivers/' + createdId)} centered>
	<div class="text-center">
		<h5 class="text-success">Kierowaca został dodany</h5>
		<div class="fw-bold">Wygenerowane hasło to:</div>
		<div class="mt-3 border p-3 fs-6 text-dark">
			{createdPassword || ''}
		</div>
	</div>
</ClosableModal>
