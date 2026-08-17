<script lang="ts">
	import { Polish } from 'flatpickr/dist/l10n/pl.js';
	import Flatpickr, { type HookProps } from 'svelte-flatpickr';
	import { Nav, NavItem, NavLink } from '@sveltestrap/sveltestrap';
	import dayjs from 'dayjs';
	import ClosableModal from './ClosableModal.svelte';
	import * as m from '$lib/paraglide/messages.js';

	const lldate: Record<string, string> = {
		yesterday: m.yesterday(),
		lastweek: m.lastweek(),
		last2weeks: m.last2weeks(),
		last30d: m.last30d(),
		last60d: m.last60d(),
		thismonth: m.thismonth(),
		lastmonth: m.lastmonth(),
	};

	interface DatePreset {
		from: string;
		to: string;
		notrial?: boolean;
	}

	interface Props {
		dateFrom?: string;
		dateTo?: string;
		setMaxDate?: boolean | string;
		update?: ((range: { from: string; to: string }) => void) | null;
		isOpen?: boolean;
		button?: boolean;
	}

	let { dateFrom = $bindable(dayjs().subtract(7, 'days').format('YYYY-MM-DD')), dateTo = $bindable(dayjs().subtract(1, 'day').format('YYYY-MM-DD')), setMaxDate = false, update = null, isOpen = $bindable(false), button = false }: Props = $props();

	// Parse ISO string as local midnight (avoids UTC shift in Warsaw/UTC+1/+2)
	const toDate = (iso: string): Date => {
		const [ y, m, d ] = iso.split('-').map(Number);
		return new Date(y, m - 1, d);
	};

	const timezoneOffset = -new Date().getTimezoneOffset() * 60000;
	const nowDate = Date.now() + timezoneOffset;

	const calculateDateBefore = (daysBefore: number, relativeDate: number = nowDate): string => {
		return dayjs(relativeDate - 86400000 * daysBefore).format('YYYY-MM-DD');
	};

	const yesterday = calculateDateBefore(1);

	const maxDate: Date | undefined = (() => {
		if (!setMaxDate) return undefined;
		if (setMaxDate === true) return toDate(yesterday);
		return toDate(setMaxDate);
	})();

	const options = {
		mode: 'range' as const,
		inline: true,
		dateFormat: 'd M',
		maxDate,
		locale: Polish
	};

	const thisMonthStart = calculateDateBefore(dayjs(yesterday).date());
	const lastMonthStart = dayjs().subtract(1, 'month').startOf('month').format('YYYY-MM-DD');
	const lastMonthEnd = calculateDateBefore(dayjs(yesterday).date() + 1);

	const CUSTOM_DATE_PRESETS: Record<string, DatePreset> = {
		yesterday: { from: yesterday, to: yesterday },
		lastweek: { from: calculateDateBefore(7), to: yesterday },
		last2weeks: { from: calculateDateBefore(14), to: yesterday, notrial: true },
		last30d: { from: calculateDateBefore(30), to: yesterday, notrial: true },
		last60d: { from: calculateDateBefore(60), to: yesterday, notrial: true },
		thismonth: { from: thisMonthStart, to: yesterday, notrial: true },
		lastmonth: { from: lastMonthStart, to: lastMonthEnd, notrial: true }
	};

	let loaded = $state(false);

	function handleChange(event: CustomEvent<HookProps>) {
		if (!loaded) return;
		const [ selectedDates ] = event.detail;
		if (selectedDates.length < 2) return;
		setDates(dayjs(selectedDates[0]).format('YYYY-MM-DD'), dayjs(selectedDates[1]).format('YYYY-MM-DD'));
	}

	function setDates(from: string, to: string) {
		value = [ toDate(from), toDate(to) ];
		dateFrom = from;
		dateTo = to;

		if (update) update({ from, to });
		isOpen = false;
	}

	// Derived so flatpickr stays in sync when props change externally
	let value = $derived([ toDate(dateFrom), toDate(dateTo) ]);

	$effect(() => {
		if (isOpen) {
			loaded = false;
			requestAnimationFrame(() => {
				loaded = true;
			});
		} else {
			loaded = false;
		}
	});
</script>

<ClosableModal bind:isOpen size="lg" headerText="Wybierz zakres dat">
	<div class="row">
		<div class="col col-12 col-md-6">
			<Nav vertical pills class="list-group mt-1 border-radius-xl navbar-vertical bg-white h-100 btn-group-vertical mx-auto" style="max-width: 307.875px">
				{#each Object.entries(CUSTOM_DATE_PRESETS) as [ presetName, preset ]}
					<NavItem class="d-hoverable btn btn-outline-light mb-0 p-0 text-start">
						<NavLink class="d-flex justify-content-between text-capitalize" onclick={() => setDates(preset.from, preset.to)}>
							{lldate[presetName]}
						</NavLink>
					</NavItem>
				{/each}
			</Nav>
		</div>
		<div class="col-12 col-md-6">
			<Flatpickr {options} on:change={handleChange} {value} />
		</div>
	</div>
</ClosableModal>

{#if button}
	<button
		class="btn btn-sm btn-outline-primary"
		onclick={() => {
			isOpen = !isOpen;
		}}
	>
		{dayjs(dateFrom).format('DD/MM')} - {dayjs(dateTo).format('DD/MM')}
	</button>
{/if}
