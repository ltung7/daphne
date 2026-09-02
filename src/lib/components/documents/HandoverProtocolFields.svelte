<script lang="ts">
	import { identificationDocumentNames } from '$lib/assets/constants';
	import CustomFormCheckSwitch from '$lib/form/CustomFormCheckSwitch.svelte';
	import CustomFormDate from '$lib/form/CustomFormDate.svelte';
	import CustomFormLanguage from '$lib/form/CustomFormLanguage.svelte';
	import CustomFormText from '$lib/form/CustomFormText.svelte';
	import CustomFormTextarea from '$lib/form/CustomFormTextarea.svelte';
	import UploadHandoverImages from '$lib/form/UploadHandoverImages.svelte';
	import { browserTranslate } from '$lib/nav/translate';
	import { addToast } from '$lib/toast';

	interface Props {
		handoverProtocol: DocumentGenerator.HandoverDocument;
		errors?: Record<string, string>;
		touch?: (field: keyof DocumentGenerator.HandoverDocument) => void;
		readonly?: boolean;
		handoverId?: string;
	}

	let { handoverProtocol = $bindable(), handoverId = '', errors = {}, touch, readonly }: Props = $props();
	let idType: string = $derived(identificationDocumentNames[handoverProtocol.identificationDocumentType as Driver.IdentificationDocumentType]);

	const onUploaded = (url: string) => {
		if (handoverProtocol.images.includes(url)) return;
		handoverProtocol.images.push(url);
	};

	const translateVisual = async () => {
		if (handoverProtocol.locale === 'pl') return;
		const translation = await browserTranslate.chrome(handoverProtocol.visual, 'pl', handoverProtocol.locale);
		if (translation?.length) handoverProtocol.translatedVisual = translation;
		else addToast('Nie udało się przetłumaczyć opisu');
	};

	$effect(() => {
		handoverProtocol.locale;
		translateVisual();
	});
</script>

<div class="row">
	<div class="col-12">
		<h5>1. Data i strony umowy</h5>
	</div>
	<div class="col-12">
		<label for="languageSelect">Język umowy</label>
		<CustomFormLanguage bind:value={handoverProtocol.locale} {readonly} />
	</div>
	<div class="col-12 col-md-6">
		<CustomFormText caption="Miejsce" bind:value={handoverProtocol.place} {readonly} />
	</div>
	<div class="col-12 col-md-6">
		<CustomFormDate caption="Data" bind:value={handoverProtocol.date} error={errors.date} onChange={() => touch?.('date')} disabled={readonly} />
	</div>
	<div class="col-12 col-md-6">
		<CustomFormText caption="Imię i nazwisko menadżera" value={handoverProtocol.managerName} readonly />
	</div>
	<div class="col-12 col-md-6">
		<CustomFormText caption="Imię i nazwisko kierowcy" value={handoverProtocol.driverName} readonly />
	</div>
	<div class="col-12 col-md-6">
		<CustomFormText caption="Rodzaj dokumentu tożsamości" value={idType} readonly />
	</div>
	<div class="col-12 col-md-6">
		<CustomFormText caption="Numer dokumentu tożsamości" value={handoverProtocol.identificationDocumentNumber} readonly />
	</div>
	<div class="col-12 border-top pt-3">
		<h5>2. Pojazd i stan licznika</h5>
	</div>
	<div class="col-12">
		<CustomFormText caption="Model pojazdu" value={handoverProtocol.model} readonly />
	</div>
	<div class="col-12 col-md-6">
		<CustomFormText caption="Numer rejestracyjny" value={handoverProtocol.registrationNumber} readonly />
	</div>
	<div class="col-12 col-md-6">
		<CustomFormText caption="VIN" value={handoverProtocol.vin} readonly />
	</div>
	<div class="col-12 col-md-6">
		<CustomFormText caption="Przebieg [km]" bind:value={handoverProtocol.milage} error={errors.milage} onblur={() => touch?.('milage')} {readonly} />
	</div>
	<div class="col-12 col-md-6">
		<CustomFormText caption="Poziom paliwa lub baterii (%)" bind:value={handoverProtocol.remaining} error={errors.remaining} onblur={() => touch?.('remaining')} {readonly} />
	</div>
	<div class="col-12 border-top pt-3">
		<h5>3. Wyposażenie i dokumenty flotowe</h5>
	</div>
	<div class="col-12 col-md-6 mb-3">
		<CustomFormCheckSwitch caption="Klucz zapasowy" bind:checked={handoverProtocol.spareKey} disabled={readonly} />
		<CustomFormCheckSwitch caption="Dowód rejestracyjny" bind:checked={handoverProtocol.registration} disabled={readonly} />
		<CustomFormCheckSwitch caption="Karta paliwowa" bind:checked={handoverProtocol.fuelCard} disabled={readonly} />
		<CustomFormCheckSwitch caption="Karta myjni" bind:checked={handoverProtocol.carWashCard} disabled={readonly} />
		<CustomFormCheckSwitch caption="Dywaniki" bind:checked={handoverProtocol.mats} disabled={readonly} />
		<CustomFormCheckSwitch caption="Uchwyt na telefon" bind:checked={handoverProtocol.phoneHolder} disabled={readonly} />
		<CustomFormCheckSwitch caption="Ładowarka telefonu" bind:checked={handoverProtocol.phoneCharger} disabled={readonly} />
	</div>
	<div class="col-12 col-md-6 mb-3">
		<CustomFormCheckSwitch caption="Klucz" bind:checked={handoverProtocol.key} disabled={readonly} />
		<CustomFormCheckSwitch caption="Gaśnica" bind:checked={handoverProtocol.exinguisher} disabled={readonly} />
		<CustomFormCheckSwitch caption="Lampa dachowa TAXI" bind:checked={handoverProtocol.roofSign} disabled={readonly} />
		<CustomFormCheckSwitch caption="Trójkąt" bind:checked={handoverProtocol.triangle} disabled={readonly} />
		<CustomFormCheckSwitch caption="Kamizelka odblaskowa" bind:checked={handoverProtocol.vest} disabled={readonly} />
		<CustomFormCheckSwitch caption="Apteczka" bind:checked={handoverProtocol.firstAidKit} disabled={readonly} />
		<CustomFormCheckSwitch caption="Koło zapasowe i zestaw naprawczy" bind:checked={handoverProtocol.tire} disabled={readonly} />
	</div>
	<div class="col-12 border-top pt-3">
		<h5>4. STAN WIZUALNY, TECHNICZNY I UWAGI</h5>
	</div>
	<div class="col-12 col-md-6">
		<CustomFormTextarea caption="Język polski" bind:value={handoverProtocol.visual} size={4} error={errors.visual} onblur={() => touch?.('visual')} {readonly} onChange={translateVisual} />
	</div>
	<div class="col-12 col-md-6">
		<CustomFormTextarea caption="Język obcy" bind:value={handoverProtocol.translatedVisual} size={4} error={errors.visual} {readonly} />
	</div>
	<div class="col-12 border-top pt-3">
		<h5>5. ZDJĘCIA POJAZDU</h5>
	</div>
	{#if handoverProtocol.images.length}
		{#each handoverProtocol.images as src, i}
			<div class="col-12 col-md-6 col-lg-3 my-2">
				<img {src} class="mw-100 border rounded" alt="Img {i}" />
			</div>
		{/each}
	{:else if readonly}
		<div class="col-12">
			<div class="fs-5 fw-bold text-center text-dark mb-3">Brak dodanych zdjęć</div>
		</div>
	{/if}
	{#if !readonly}
		<div class="col-12 mb-3">
			<UploadHandoverImages {onUploaded} {handoverId} />
		</div>
	{/if}
	<div class="col-12 border-top pt-3">
		<h5>6. POTWIERDŹ ADRES EMAIL</h5>
	</div>
	<div class="col-12 col-md-6">
		<CustomFormText caption="Adres e‑mail kierownika" bind:value={handoverProtocol.managerEmail} {readonly} />
	</div>
	<div class="col-12 col-md-6">
		<CustomFormText caption="Adres e‑mail kierowcy" bind:value={handoverProtocol.driverEmail} {readonly} />
	</div>
</div>
