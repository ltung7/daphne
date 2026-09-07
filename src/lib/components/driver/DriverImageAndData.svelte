<script lang="ts">
	import { languageLevels, languages } from "$lib/assets/constants";
	import DriverStatus from "$lib/misc/DriverStatus.svelte";
	import LanguageFlag from "$lib/misc/LanguageFlag.svelte";
	import UIcon from "$lib/misc/UIcon.svelte";

	interface Props {
		driver: Driver.Driver;
	}

	const { driver }: Props = $props();

    const languageNames = languages.reduce(
		(obj, item) => {
			obj[item[0]] = item[2];
			return obj;
		},
		{} as Record<string, string>
	);
</script>

<div class="d-flex">
	<div class="driver-image rounded">
		<img src={driver.imageUrl ?? '/img/user.jpg'} alt={driver.name} />
	</div>

	<div class="w-100 ms-3">
		<table class="table table-striped small mb-0">
			<tbody>
				<tr>
					<td>Status</td>
					<td class="py-1">
						<DriverStatus status={driver.status} />
					</td>
				</tr>
				<tr>
					<td>Login</td>
					<td>{driver.login}</td>
				</tr>
				<tr>
					<td>Imię i nazwisko</td>
					<td>{driver.name}</td>
				</tr>
				<tr>
					<td>Adres e-mail</td>
					<td>
						<a href="mailto:{driver.email}" class="d-flex">
							<UIcon name="envelope" class="me-2" size={7} />
							{driver.email}
						</a>
					</td>
				</tr>
				<tr>
					<td>Numer telefonu</td>
					<td>
						<a href="tel:{driver.phone}" class="d-flex">
							<UIcon name="phone-call" class="me-2" size={7} />
							{driver.phone}
						</a>
					</td>
				</tr>
				<tr>
					<td>Adres korespondencyjny</td>
					<td>{driver.address}</td>
				</tr>
				<tr>
					<td>
                        <span class="me-2"><LanguageFlag language="pl" /></span>
                        Język polski
                    </td>
					<td>{languageLevels[driver.polishLanguage] ?? driver.polishLanguage}</td>
				</tr>
				{#each Object.entries(driver.additionalLanguages) as [ lang, level ]}
					<tr>
						<td>
                            <span class="me-2"><LanguageFlag language={lang} /></span>
                            Język {(languageNames[lang] ?? lang).toLowerCase()}</td>
						<td>{languageLevels[level] ?? level}</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
</div>
