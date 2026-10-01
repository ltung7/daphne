<script lang="ts" generics="T extends DocumentGenerator.HandoverDocument = DocumentGenerator.HandoverDocument">
	import { identificationDocumentNames } from '$lib/assets/constants';
	import CustomFormCheckSwitch from '$lib/form/CustomFormCheckSwitch.svelte';
	import CustomFormDate from '$lib/form/CustomFormDate.svelte';
	import CustomFormLanguage from '$lib/form/CustomFormLanguage.svelte';
	import CustomFormText from '$lib/form/CustomFormText.svelte';
	import CustomFormTextarea from '$lib/form/CustomFormTextarea.svelte';
	import CameraCaptureInspection from '$lib/misc/CameraCaptureInspection.svelte';
	import { browserTranslate } from '$lib/nav/translate';
	import { addToast } from '$lib/toast';

	const BASE_VISUAL_TRANSLATE = {
		pl: 'Pojazd czysty na zewnątrz i wewnątrz. Brak uszkodzeń karoserii, szyb i wnętrza. Pojazd sprawny technicznie, brak komunikatów o błędach.',
		en: 'Vehicle is clean inside and out. No damage to bodywork, glass, or interior. Vehicle is technically sound, no error messages.',
		uk: 'Транспортний засіб чистий зовні та всередині. Відсутні пошкодження кузова, скла та салону. Автомобіль технічно справний, повідомлення про помилки відсутні.',
		be: 'Транспартны сродак чысты звонку і ўнутры. Няма пашкоджанняў кузава, шкла і салона. Транспартны сродак тэхнічна спраўны, паведамленні пра памылкі адсутнічаюць.',
		ne: 'सवारी साधन बाहिर र भित्र सफा छ। बडी, सिसा र भित्री भागमा कुनै क्षति छैन। सवारी साधन प्राविधिक रूपमा दुरुस्त छ, कुनै त्रुटि सन्देश छैन।',
		cs: 'Vozidlo je čisté zvenku i uvnitř. Bez poškození karoserie, skel a interiéru. Vozidlo je technicky v pořádku, bez chybových hlášení.',
		sr: 'Vozilo je čisto spolja i iznutra. Bez oštećenja karoserije, stakala i enterijera. Vozilo je tehnički ispravno, bez poruka o greškama.'
	};

	interface Props {
		handoverProtocol: T;
		errors?: Record<string, string>;
		touch?: (field: any) => void;
		readonly?: boolean;
	}

	let { handoverProtocol = $bindable(), errors = {}, touch, readonly }: Props = $props();
	let record = $derived(handoverProtocol as unknown as DocumentGenerator.HandoverDocumentRecord);
	let idType: string = $derived(identificationDocumentNames[handoverProtocol.identificationDocumentType as Driver.IdentificationDocumentType]);

	const onFinished = (progress: SvelteCustom.SavedProgress<Vehicle.ImageInspectionCategory>) => {
		const urls = Object.values(progress)
			.map((file) => file?.src)
			.filter(Boolean) as string[];
		handoverProtocol.images = urls;
	};

	const translateVisual = async () => {
		if (handoverProtocol.locale === 'pl') return;

		if (handoverProtocol.visual === BASE_VISUAL_TRANSLATE.pl && BASE_VISUAL_TRANSLATE[handoverProtocol.locale]) {
			handoverProtocol.translatedVisual = BASE_VISUAL_TRANSLATE[handoverProtocol.locale];
			return;
		}

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
		<CustomFormText caption="Rodzaj dokumentu tożsamości kierowcy" value={idType} readonly />
	</div>
	<div class="col-12 col-md-6">
		<CustomFormText caption="Numer dokumentu tożsamości kierowcy" value={handoverProtocol.identificationDocumentNumber} readonly />
	</div>
	{#if record.witness}
		<div class="col-12 col-md-6">
			<CustomFormText caption="Świadek" value={record.witness} readonly />
		</div>
	{/if}
	{#if record.reasonForRecovery}
		<div class="col-12">
			<CustomFormText caption="Powód odbioru" value={record.reasonForRecovery} readonly />
		</div>
	{/if}
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
	{#if handoverProtocol.images?.length}
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
			<!-- <UploadHandoverImages {onUploaded} {handoverId} /> -->
			<CameraCaptureInspection onfinished={onFinished} />
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
	{#if record.foundItems?.length}
		<div class="col-12 border-top pt-3">
			<h5>7. ZNALEZIONE PRZEDMIOTY</h5>
		</div>
		<div class="col-12">
			<ul>
				{#each record.foundItems as item}
					<li class="text-dark">{item}</li>
				{/each}
			</ul>
		</div>
	{/if}
</div>
