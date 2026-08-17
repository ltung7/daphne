<script lang="ts">
	import { env } from '$env/dynamic/public';

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
		onSelect?: (point: Paczkomat) => void;
	}
	let { onSelect }: Props = $props();

    function initWidget(event: CustomEvent) {
        const api = event.detail.api;
        
        // Register the selection callback via the API
        api.addPointSelectedCallback((point: Paczkomat) => {
            if (onSelect) onSelect(point);
        });
    }
</script>

<svelte:head>
	<!-- InPost Geowidget assets -->
	<link rel="stylesheet" href="https://geowidget.inpost.pl/inpost-geowidget.css" />
	<script src="https://geowidget.inpost.pl/inpost-geowidget.js" defer></script>
</svelte:head>

<div style="height: 600px;">
	<inpost-geowidget oninpost.geowidget.init={initWidget} token={env.PUBLIC_INPOST_GEOWIDGET_KEY} language="pl" config="parcelCollect" style="width: 100%; height: 600px;"></inpost-geowidget>
</div>