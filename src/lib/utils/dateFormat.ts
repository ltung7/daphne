export function formatDateTimePL(timestamp: number | string | Date): string {
	return new Intl.DateTimeFormat('pl-PL', {
		day: 'numeric',
		month: 'short',
		hour: '2-digit',
		minute: '2-digit'
	}).format(new Date(timestamp));
}

export function formatDatePL(timestamp: number | string | Date): string {
	return new Intl.DateTimeFormat('pl-PL', {
		day: 'numeric',
		month: 'short',
		year: 'numeric'
	}).format(new Date(timestamp));
}

export function formatTimePL(timestamp: number | string | Date): string {
	return new Intl.DateTimeFormat('pl-PL', {
		hour: '2-digit',
		minute: '2-digit'
	}).format(new Date(timestamp));
}