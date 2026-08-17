<script lang="ts">
	import { options, yAxisData } from './chartcfg';
	import ChartCanvas from './ChartCanvas.svelte';
	import type { ChartConfiguration } from 'chart.js';
	import dayjs from 'dayjs';
	import { SvelteMap } from 'svelte/reactivity';
	import * as m from '$lib/paraglide/messages.js';

	interface Props {
		stats: Streamer.DailyStatistics[];
		dateFrom?: string;
		dateTo?: string;
	}

	const { stats, dateFrom, dateTo }: Props = $props();

	const METRICS = {
		finished: { color: '#2dce89', caption: m.orders(), yAxis: 'yNumeric' },
		cancelled: { color: '#8392ab', caption: m.basketsCancelled(), yAxis: 'yNumeric' },
		new: { color: '#5e72e4', caption: m.basketsNew(), yAxis: 'yNumeric' },
		reserved: { color: '#fc8368', caption: m.reservationsHeader(), yAxis: 'yNumeric' },
		value: { color: '#1b5e20', caption: m.ordersValue(), yAxis: 'yCurrency' }
	};

	const formatCurrency = (value: number | string, currency: string | null = null) => {
		if (typeof value === 'string') value = parseFloat(value);
		if (!currency) currency = 'PLN';
		let locale = 'pl';
		if (currency === 'EUR' || currency === 'USD') locale = 'en';
		const formatted = new Intl.NumberFormat(locale, { style: 'currency', currency }).format(value);
		return formatted;
	};

	const config: ChartConfiguration<'line'> = $derived.by(() => {
		// Determine date range
		const allDates = stats.map((s) => dayjs(s.date));
		const from = dateFrom ? dayjs(dateFrom) : allDates.length > 0 ? allDates.reduce((a, b) => (a.isBefore(b) ? a : b)) : dayjs();
		const to = dateTo ? dayjs(dateTo) : allDates.length > 0 ? allDates.reduce((a, b) => (a.isAfter(b) ? a : b)) : dayjs();

		// Build a full date range so every date has a record even if 0
		const labels: string[] = [];
		const dates: string[] = [];
		let cursor = from.startOf('day');
		const end = to.startOf('day');
		while (!cursor.isAfter(end)) {
			labels.push(cursor.format('DD.MM'));
			dates.push(cursor.format('YYYY-MM-DD'));
			cursor = cursor.add(1, 'day');
		}

		// Index stats by date for O(1) lookup
		const statsMap = new SvelteMap<string, Streamer.DailyStatistics>();
		for (const s of stats) {
			statsMap.set(dayjs(s.date).format('YYYY-MM-DD'), s);
		}

		const getValue = (key: keyof Omit<Streamer.DailyStatistics, 'id' | 'date'>, date: string) => statsMap.get(date)?.[key] ?? 0;

		const datasets = ([ 'new', 'finished', 'reserved', 'cancelled', 'value' ] as const).map((key) => ({
			label: METRICS[key].caption,
			data: dates.map((date) => getValue(key, date)),
			borderColor: METRICS[key].color,
			backgroundColor: METRICS[key].color,
			borderWidth: 2,
			pointRadius: 3,
			pointHoverRadius: 5,
			tension: 0.3,
			fill: false,
			yAxisID: METRICS[key].yAxis
		}));

		yAxisData.yCurrency!.ticks!.callback = (value: string | number) => formatCurrency(value);
		options.plugins!.tooltip!.callbacks = {
			label: function (context) {
				let label = context.dataset.label + ': ';
				if (context.parsed.y !== null) {
					if (context.dataset.yAxisID === 'yCurrency' || context.dataset.yAxisID === 'yCurrencyMinor') label += formatCurrency(context.parsed.y, 'PLN');
					else label += context.parsed.y.toFixed(0);
				}
				return label;
			}
		};

		return {
			type: 'line' as const,
			data: { labels, datasets },
			options: {
				...options,
				scales: {
					x: {
						...(options as any)?.scales?.x,
						type: 'category' as const,
						title: {
							display: true,
							text: m.date()
						}
					},
					yNumeric: {
						...yAxisData.yNumeric,
						beginAtZero: true,
						title: {
							display: true,
							text: m.basketsOrdersCount()
						}
					},
					yCurrency: {
						...yAxisData.yCurrency,
						position: 'right',
						beginAtZero: true,
						title: {
							display: true,
							text: m.ordersValue()
						}
					}
				}
			}
		};
	});
</script>

<ChartCanvas {config} />
