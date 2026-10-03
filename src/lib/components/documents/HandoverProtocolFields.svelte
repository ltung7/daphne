<script lang="ts" generics="T extends DocumentGenerator.HandoverDocument = DocumentGenerator.HandoverDocument">
	import { identificationDocumentNames } from '$lib/assets/constants';
	import CustomFormDate from '$lib/form/CustomFormDate.svelte';
	import CustomFormLanguage from '$lib/form/CustomFormLanguage.svelte';
	import CustomFormText from '$lib/form/CustomFormText.svelte';
	import CustomFormTextarea from '$lib/form/CustomFormTextarea.svelte';
	import CameraCaptureInspection from '$lib/misc/CameraCaptureInspection.svelte';
	import { browserTranslate } from '$lib/nav/translate';
	import { addToast } from '$lib/toast';
	import HandoverProtocolEquipment from './HandoverProtocolEquipment.svelte';
	import type { RequiredEquipment } from '$lib/assets/constants';

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
		requiredEquipment?: RequiredEquipment;
		errors?: Record<string, string>;
		touch?: (field: any) => void;
		readonly?: boolean;
		unilateral?: boolean;
	}

	let { handoverProtocol = $bindable(), requiredEquipment, errors = {}, touch, readonly, unilateral = false }: Props = $props();
	let record = $derived(handoverProtocol as unknown as DocumentGenerator.HandoverDocumentRecord);
	let idType: string = $derived(identificationDocumentNames[handoverProtocol.identificationDocumentType as Driver.IdentificationDocumentType]);

	let foundItemsText = $state('');
	let isFocusedOnFoundItems = $state(false);

	$effect(() => {
		const r = record as any;
		if (r.foundItems) {
			const currentText = r.foundItems.join('\n');
			if (currentText !== foundItemsText && !isFocusedOnFoundItems) {
				foundItemsText = currentText;
			}
		}
	});

	const updateFoundItems = () => {
		(handoverProtocol as any).foundItems = foundItemsText.split('\n').filter((s) => s.trim() !== '');
	};

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
	{#if unilateral && typeof (handoverProtocol as any).witness === 'string'}
		<div class="col-12 col-md-6">
			<CustomFormText caption="Świadek" bind:value={(handoverProtocol as any).witness} {readonly} placeholder={readonly ? '' : 'Imię i nazwisko świadka'} error={errors.witness} onblur={() => touch?.('witness')} />
		</div>
	{:else if record.witness}
		<div class="col-12 col-md-6">
			<CustomFormText caption="Świadek" value={record.witness} readonly />
		</div>
	{/if}
	{#if unilateral && typeof (handoverProtocol as any).witnessEmail === 'string'}
		<div class="col-12 col-md-6">
			<CustomFormText caption="Email świadka" bind:value={(handoverProtocol as any).witnessEmail} {readonly} placeholder={readonly ? '' : 'adres@email.com'} error={errors.witnessEmail} onblur={() => touch?.('witnessEmail')} />
		</div>
	{:else if (record as any).witnessEmail}
		<div class="col-12 col-md-6">
			<CustomFormText caption="Email świadka" value={(record as any).witnessEmail} readonly />
		</div>
	{/if}
	{#if unilateral && typeof (handoverProtocol as any).reasonForRecovery === 'string'}
		<div class="col-12">
			<CustomFormText caption="Powód odbioru" bind:value={(handoverProtocol as any).reasonForRecovery} {readonly} error={errors.reasonForRecovery} onblur={() => touch?.('reasonForRecovery')} />
		</div>
	{:else if record.reasonForRecovery}
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
	<HandoverProtocolEquipment bind:handoverProtocol {requiredEquipment} {readonly} />
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
			<div class="col-12 col-md-6 col-lg-3 col-xl-2 my-2">
				<img {src} class="mw-100 border rounded" alt="Img {i}" />
			</div>
		{/each}
	{:else if readonly}
		<div class="col-12">
			<div class="fs-5 fw-bold text-center text-dark mb-3">Brak dodanych zdjęć</div>
		</div>
	{/if}
	{#if !readonly}
		<div class="col-12 mb-3 flex-center">
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
	{#if unilateral && (handoverProtocol as any).foundItems !== undefined}
		<div class="col-12 border-top pt-3">
			<h5>7. ZNALEZIONE PRZEDMIOTY</h5>
		</div>
		<div class="col-12">
			<CustomFormTextarea
				bind:value={foundItemsText}
				caption="Rzeczy pozostawione przez kierowcę (każdy przedmiot od nowej linii)"
				error={errors.foundItems}
				onblur={() => {
					touch?.('foundItems');
					isFocusedOnFoundItems = false;
				}}
				onChange={updateFoundItems}
				onInput={updateFoundItems}
				id="foundItemsTextarea"
				{readonly}
			/>
		</div>
	{:else if record.foundItems?.length}
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
