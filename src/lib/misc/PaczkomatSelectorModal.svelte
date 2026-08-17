<script lang="ts">
	import ClosableModal from "./ClosableModal.svelte";
	import PaczkomatWidget from "./PaczkomatWidget.svelte";

    interface Paczkomat {
		href: string;
		name: string;
		type: Array<string>;
		status: string;
		location: {
			longitude: number;
			latitude: number;
		};
		location_type: string;
		location_date: any;
		location_description: string;
		location_description_1: any;
		location_description_2: any;
		distance: number;
		opening_hours: string;
		address: {
			line1: string;
			line2: string;
		};
		address_details: {
			city: string;
			province: string;
			post_code: string;
			street: string;
			building_number: string;
			flat_number: any;
		};
		phone_number: any;
		payment_point_descr: string;
		functions: Array<string>;
		partner_id: number;
		is_next: boolean;
		payment_available: boolean;
		payment_type: {
			'0': string;
		};
		virtual: string;
		recommended_low_interest_box_machines_list: Array<string>;
		apm_doubled: any;
		location_247: boolean;
		operating_hours_extended: {
			customer: any;
		};
		agency: string;
		image_url: string;
		easy_access_zone: boolean;
		air_index_level: any;
		physical_type_mapped: string;
		physical_type_description: any;
	}

    interface Props {
        isOpen?: boolean;
        onSelect?: (point: Streamer.SelectedPickupPoint) => void;
    }

    let {
        isOpen = $bindable(false),
        onSelect,
    }: Props = $props();

    function handleSelect (point: Paczkomat) {
        if (!onSelect) return;
        const selected: Streamer.SelectedPickupPoint = {
            id: point.name,
            name: point.name, 
            address: point.address.line1 + ', ' + point.address.line2,
        }
        onSelect(selected);
    }
</script>

<ClosableModal bind:isOpen>
    <PaczkomatWidget onSelect={handleSelect} />
</ClosableModal>