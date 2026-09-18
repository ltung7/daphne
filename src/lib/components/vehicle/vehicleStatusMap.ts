export interface StatusConfig {
	icon: string;
	caption: string;
	text: string;
	color: string;
}

export const vehicleStatusMap: Record<Vehicle.Status, StatusConfig> = {
	available: {
		icon: 'check-circle',
		caption: 'Dostępny',
		text: 'Pojazd jest sprawny i gotowy do przypisania.',
		color: '#22c55e'
	},
	assigned: {
		icon: 'user-check',
		caption: 'Przypisany',
		text: 'Pojazd został przypisany do kierowcy lub zadania.',
		color: '#3b82f6'
	},
	broken: {
		icon: 'triangle-warning',
		caption: 'Uszkodzony',
		text: 'Pojazd jest niesprawny i wymaga naprawy.',
		color: '#ef4444'
	},
	unmovable: {
		icon: 'ban',
		caption: 'Unieruchomiony',
		text: 'Pojazd nie może zostać przemieszczony w obecnym stanie.',
		color: '#b91c1c'
	},
	under_maintenance: {
		icon: 'wrench-simple',
		caption: 'W serwisie',
		text: 'Pojazd znajduje się obecnie w trakcie przeglądu lub naprawy.',
		color: '#f59e0b'
	},
	retired: {
		icon: 'archive',
		caption: 'Wycofany',
		text: 'Pojazd został trwale wycofany z eksploatacji.',
		color: '#6b7280'
	},
	precheck: {
		icon: 'clipboard-check',
		caption: 'Weryfikacja',
		text: 'Pojazd oczekuje na kontrolę wstępną przed dopuszczeniem do użytku.',
		color: '#8b5cf6'
	}
};
