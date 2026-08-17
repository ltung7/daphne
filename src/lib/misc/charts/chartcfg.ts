import type { ChartOptions } from "chart.js";

export const options: ChartOptions<'line'> = {
	maintainAspectRatio: false,
	interaction: {
		intersect: false,
		mode: 'x'
	},
	plugins: {
		tooltip: {
			enabled: true,
			position: 'nearest'
		},
		legend: {
			display: true,
			position: 'bottom'
		}
	},
	scales: {
		x: {
			grid: {
				display: false,
				drawOnChartArea: false,
				drawTicks: false,
			},
			ticks: {
				display: true,
				color: 'black',
				padding: 10,
				font: {
					size: 14,
					weight: 400,
					family: 'Open Sans',
					style: 'normal',
					lineHeight: 2
				}
			}
		}
	}
};

export const colors = {
	revenue: '#00AA00',
	cost: '#FF3333',
	transactions: '#0000AA',
	visits: '#00AAAA',
	clicks: '#AAAA00',
	impressions: '#AA00AA',
	users: '#FFAA33',
	cos: '#6B0A54',
	abv: '#1A5B1A',
	cps: '#4E3AAD',
	ctr: '#56D4AE',
	cpc: '#5C7918',
	cr: '#793D18',
	cpm: '#8C232A',
	cpu: '#4F5014',
	rpv: '#CE1E90',
	atc: '#E0115F',
	orders: '#008800',
	products: '#800080',
	returns: '#008888',
    complaints: '#CC0000',
	sessions: '#333333'
};

export const darkColors = {
	revenue: '#00FF00',
	cost: '#FF3333',
	transactions: '#3333FF',
	visits: '#00AAAA',
	clicks: '#AAAA00',
	impressions: '#AA00AA',
	users: '#FFAA33',
	cos: '#AA33AA',
	abv: '#66FFAA',
	cps: '#4E3AAD',
	ctr: '#56D4AE',
	cpc: '#99AA00',
	cr: '#AA6633',
	cpm: '#AA3333',
	cpu: '#999933',
	rpv: '#CE1E90',
	atc: '#E0115F',
	orders: '#008800',
	products: '#800080',
	returns: '#008888',
    complaints: '#CC0000',
	sessions: '#9999AA'
};

export const yAxisData: NonNullable<ChartOptions<'line'>['scales']> = {
	yCurrency: {
		beginAtZero: true,
		grid: {
			display: true,
			drawOnChartArea: true,
			drawTicks: false,
			color: 'silver'
		},
		ticks: {
			display: true,
			color: 'black',
			padding: 10,
			font: {
				size: 14,
				weight: 400,
				family: 'Open Sans',
				style: 'normal',
				lineHeight: 2
			}
		}
	},
	yCurrencyMinor: {
		beginAtZero: true,
		grid: {
			display: true,
			drawOnChartArea: true,
			drawTicks: false,
			color: 'silver'
		},
		ticks: {
			display: true,
			color: 'black',
			padding: 10,
			font: {
				size: 14,
				weight: 400,
				family: 'Open Sans',
				style: 'normal',
				lineHeight: 2
			}
		}
	},
	yNumeric: {
		beginAtZero: true,
		grid: {
			display: true,
			drawOnChartArea: true,
			drawTicks: false,
			color: 'silver'
		},
		ticks: {
			display: true,
			color: 'black',
			padding: 10,
			stepSize: 1,
			font: {
				size: 14,
				weight: 400,
				family: 'Open Sans',
				style: 'normal',
				lineHeight: 2
			}
		}
	},
	yPercent: {
		beginAtZero: true,
		grid: {
			display: true,
			drawOnChartArea: true,
			drawTicks: false,
			color: 'silver'
		},
		ticks: {
			display: true,
			color: 'black',
			padding: 10,
			font: {
				size: 14,
				weight: 400,
				family: 'Open Sans',
				style: 'normal',
				lineHeight: 2
			},
			callback: function (value: string|number) {
				return value + '%';
			}
		}
	}
};

export const randomColor = () => '#' + Math.floor(Math.random() * 15728639 + 1048576).toString(16);
