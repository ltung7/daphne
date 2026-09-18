export interface StatusConfig {
	icon: string;
	caption: string;
	text: string;
	color: string;
}

export const driverStatusMap: Record<Driver.Status, StatusConfig> = {
	pending_verification: {
		icon: 'clipboard-check',
		caption: 'Weryfikacja dokumentów',
		text: 'Dokumenty i informacje oczekują na weryfikację.',
		color: '#8b5cf6'
	},
	rejected: {
		icon: 'triangle-warning',
		caption: 'Odrzucono',
		text: 'Zgłoszenie zostało odrzucone. Proszę sprawdzić szczegóły.',
		color: '#ef4444'
	},
	available: {
		icon: 'check-circle',
		caption: 'Dostępny',
		text: 'Kierowca jest dostępny i oczekuje na przydzielnie pojazdu.',
		color: '#22c55e'
	},
	active: {
		icon: 'user-check',
		caption: 'Aktywny',
		text: 'Kierowca jest aktywny i upoważniony do odbierania zleceń.',
		color: '#3b82f6'
	},
	inactive: {
		icon: 'user-forbidden-alt',
		caption: 'Nieaktywny',
		text: 'Kierowca jest nieaktywny i nie może odbierać zleceń.',
		color: '#6b7280'
	},
	on_leave: {
		icon: 'umbrella-beach',
		caption: 'Na urlopie',
		text: 'Kierowca przebywa na urlopie.',
		color: '#f59e0b'
	},
	documents_expired: {
		icon: 'portfolio',
		caption: 'Dokumenty wygasły',
		text: 'Dokumenty wygasły. Konto zostało zablokowane do czasu ich odnowienia.',
		color: '#dc2626'
	},
	suspended: {
		icon: 'user-forbidden',
		caption: 'Zawieszony',
		text: 'Konto zostało tymczasowo zawieszone z powodu naruszeń zasad.',
		color: '#895129'
	},
	banned: {
		icon: 'user-forbidden',
		caption: 'Zablokowany',
		text: 'Konto zostało trwale zablokowane. Proszę skontaktować się z administracją.',
		color: '#991b1b'
	},
	archived: {
		icon: 'archive',
		caption: 'Zarchiwizowany',
		text: 'Konto zostało zarchiwizowane, niedostępne dla nowych zleceń.',
		color: '#6b7280'
	},
};
