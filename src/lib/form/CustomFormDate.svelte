<script lang="ts">
	import { Polish } from 'flatpickr/dist/l10n/pl.js';
	import Flatpickr, { type HookProps } from 'svelte-flatpickr';
	import { Modal, ModalBody, ModalFooter, ModalHeader } from '@sveltestrap/sveltestrap';
	import UIcon from '$lib/misc/UIcon.svelte';
	import { slide } from 'svelte/transition';

	/** Props definition */
	interface Props {
		/** The HTML‑label / input identifier (used to build the internal ``id``) */
		name?: string;
		/** The selected date in ISO format YYYY-MM-DD (empty string when nothing chosen) */
		value?: string;
		/** Disables the whole control when true */
		disabled?: boolean;
		/** Placeholder text for the readonly input */
		placeholder?: string;
		/** Optional label caption (if you want a label above the input) */
		caption?: string;
		/** Input size (Bootstrap utility, e.g. 6 for form-control fs-6) */
		size?: number;
		/** Additional CSS class */
		class?: string;
		/** Input id (if not provided, one is generated from name) */
		id?: string;
		setMaxDate?: boolean | string;
		/** Readonly attribute */
		onChange?: null | ((value: string) => any);
		error?: string;
	}

	/** Destructure incoming props – Svelte 5 runes */
	let { name, error, value: dateValue = $bindable(''), setMaxDate = false, disabled = false, placeholder = 'Wybierz datę', caption = '', size = 6, class: className = '', id = 'flatpickr_' + Math.random().toString().slice(2), onChange }: Props = $props();

	/** Local state for the flatpickr calendar (bound to the same string) */
	let isOpen = $state(false);

	// /** Sync prop changes to local state (in case parent updates value from outside) */
	// $effect(() => {
	// 	if (dateValue !== undefined && dateValue !== flatpickrValue) {
	// 		flatpickrValue = dateValue;
	// 	}
	// });

	const toDate = (iso: string): Date => {
		const [ y, m, d ] = iso.split('-').map(Number);
		return new Date(y, m - 1, d);
	};

	const maxDate: Date | undefined = (() => {
		if (!setMaxDate) return undefined;
		if (setMaxDate === true) {
            // eslint-disable-next-line svelte/prefer-svelte-reactivity
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            return yesterday;
        }
		return toDate(setMaxDate);
	})();

	const toggle = () => {
		isOpen = !disabled && !isOpen;
	};

	const handleManualChange = () => {
		onChange?.(dateValue);
	}

	function handleChange(event: CustomEvent<HookProps>) {
		const [ selectedDates ] = event.detail;
		if (selectedDates.length < 1) return;
		// Use toLocaleDateString with 'en-CA' locale to get YYYY-MM-DD in local timezone
		const chosenDate = selectedDates[0];
		const chosen = chosenDate.toLocaleDateString('en-CA');
		dateValue = chosen;
		onChange?.(chosen);
		isOpen = false;
	}

	const options = {
		mode: 'range' as const,
		inline: true,
		dateFormat: 'd M',
		locale: Polish,
        maxDate
	};
</script>

{#if caption?.length}
	<label for={id} class="mb-1">{caption}</label>
{/if}
<!-- Input group wrapper -->
<div class="input-group has-date-picker mb-3 {className}">
	<input {id} {name} type="text" {placeholder} readonly={disabled} class="form-control fs-{size} text-dark" bind:value={dateValue} onclick={toggle} autocomplete="off" onchange={handleManualChange} />

	<!-- Button to open the modal picker -->
	<button class="btn btn-secondary mb-0 flex-center" type="button" onclick={toggle}>
		<UIcon name="calendar" />
	</button>
</div>
{#if error}<div class="xsmall text-danger mt-n3 mb-3" transition:slide>{error}</div>{/if}

<!-- Modal with Flatpickr -->
{#if isOpen}
	<Modal bind:isOpen {toggle} modalClassName="date-pick" centered>
		<ModalHeader>Wybierz datę</ModalHeader>
		<ModalBody>
			<Flatpickr {options} on:change={handleChange} />
		</ModalBody>
		<ModalFooter>
			<button class="btn btn-secondary mb-0" onclick={toggle}>Zamknij</button>
		</ModalFooter>
	</Modal>
{/if}