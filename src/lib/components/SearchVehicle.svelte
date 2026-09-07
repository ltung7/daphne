<script lang="ts">
	import { internal } from '$lib/nav/internal';
	import { addToast } from '$lib/toast';
	
	type Props = {
		onfound?: (vehicle: Vehicle.Vehicle) => void;
	};

	let { onfound }: Props = $props();

	const REGISTRATION_NUMBER_PATTERN = /^[A-Z0-9]{3,9}$/;
	const AZTEC_CODE_PATTERN = /^[A-Za-z0-9+/]{2,}={0,2}$/;

	let searchTerm: string = $state('WW752XH');
	let isLoading: boolean = $state(false);

	// Detect input type and perform search
	const detectAndSearch = async () => {
		if (!searchTerm?.trim()) {
			return;
		}

		isLoading = true;

		try {
			let term = searchTerm.trim();
			const isAztec = AZTEC_CODE_PATTERN.test(term) && term.length > 20;

			if (isAztec) {
				const aztecResponse = await internal.post('/api/aztec', { b64Input: searchTerm });
				if (aztecResponse.vehicle.registrationNumber) {
					term = aztecResponse.vehicle.registrationNumber;
				} else {
					addToast('Niepoprawny kod AZTEC');
					return;
				}
			}
			term = term
				.replace(/[^a-zA-Z0-9]/g, '')
				.trim()
				.toUpperCase();
			const isRegistration = REGISTRATION_NUMBER_PATTERN.test(term);
			if (!isRegistration) {
				addToast('Niepoprawny Numer rejestracyjny');
				return;
			}

			const vehicleResponse = await internal.get(`/vehicles/${term}/api`);
			if (vehicleResponse.vehicle && onfound) {
                onfound(vehicleResponse.vehicle);
                searchTerm = '';
            }
		} catch (err) {
			addToast(err instanceof Error ? err.message : 'Błąd podczas wyszukiwania');
		} finally {
			isLoading = false;
		}
	};
</script>

<div class="card card-body mb-4">
	<form
		onsubmit={(e) => {
			e.preventDefault();
			detectAndSearch();
		}}
	>
		<div class="input-group">
			<input type="text" class="form-control" placeholder="Numer rejestracyjny (np. ABC1234) lub kod Aztec..." bind:value={searchTerm} onchange={detectAndSearch} aria-label="Termin wyszukiwania" />
			<button class="btn btn-primary mb-0" type="submit" disabled={isLoading || !searchTerm?.trim()}>
				{isLoading ? 'Wyszukiwanie...' : 'Wyszukaj'}
			</button>
		</div>
	</form>
</div>
