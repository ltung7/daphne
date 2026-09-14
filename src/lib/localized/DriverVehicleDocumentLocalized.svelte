<script lang="ts">
	import { m } from '$lib/paraglide/messages.js';
	import TooltipSquareIconLink from '../misc/TooltipSquareIconLink.svelte';

	interface Props {
		doc: Vehicle.VehicleDocument | Driver.DriverDocument;
	}

	let { doc }: Props = $props();

	const documentTypeLabels: Record<string, () => string> = {
		// Vehicle documents
		registration_certificate: () => m.doc_registration_certificate(),
		ownership_proof: () => m.doc_ownership_proof(),
		lease_agreement: () => m.doc_lease_agreement(),
		taxi_license_excerpt: () => m.doc_taxi_license_excerpt(),
		oc_insurance_policy: () => m.doc_oc_insurance_policy(),
		ac_insurance_policy: () => m.doc_ac_insurance_policy(),
		technical_inspection_certificate: () => m.doc_technical_inspection_certificate(),
		internal_checkup_report: () => m.doc_internal_checkup_report(),
		damage_incident_report: () => m.doc_damage_incident_report(),
		vehicle_history: () => m.doc_vehicle_history(),
		fleet_taxi_license: () => m.doc_fleet_taxi_license(),
		taxi_marking_confirmation: () => m.doc_taxi_marking_confirmation(),
		vehicle_photo_exterior: () => m.doc_vehicle_photo_exterior(),
		vehicle_photo_interior: () => m.doc_vehicle_photo_interior(),
		platform_approval_uber: () => m.doc_platform_approval_uber(),
		platform_approval_bolt: () => m.doc_platform_approval_bolt(),
		platform_approval_freenow: () => m.doc_platform_approval_freenow(),
		telematics_installation_certificate: () => m.doc_telematics_installation_certificate(),
		fuel_card_agreement: () => m.doc_fuel_card_agreement(),
		taximeter_legalization_certificate: () => m.doc_taximeter_legalization_certificate(),
		vehicle_handover_document: () => m.doc_vehicle_handover_document(),
		vehicle_handover_return_document: () => m.doc_vehicle_handover_return_document(),
		vehicle_handover_unilateral_document: () => m.doc_vehicle_handover_unilateral_document(),

		// Driver documents
		driving_license_front: () => m.doc_driving_license_front(),
		driving_license_back: () => m.doc_driving_license_back(),
		id_card_front: () => m.doc_id_card_front(),
		id_card_back: () => m.doc_id_card_back(),
		residence_permit_front: () => m.doc_residence_permit_front(),
		residence_permit_back: () => m.doc_residence_permit_back(),
		passport_main_page: () => m.doc_passport_main_page(),
		polish_criminal_record_certificate: () => m.doc_polish_criminal_record_certificate(),
		foreign_criminal_record_certificate: () => m.doc_foreign_criminal_record_certificate(),
		medical_certificate: () => m.doc_medical_certificate(),
		psychological_certificate: () => m.doc_psychological_certificate(),
		taxi_driver_id_front: () => m.doc_taxi_driver_id_front(),
		taxi_driver_id_back: () => m.doc_taxi_driver_id_back(),
		taxi_driver_id_decision: () => m.doc_taxi_driver_id_decision(),
	};

	const getDocumentTypeLabel = (type: string): string => {
		const labelFn = documentTypeLabels[type];
		return labelFn ? labelFn() : type;
	};
</script>

<li class="list-group-item flex-between">
	<div>
		<div class="text-muted xsmall">{getDocumentTypeLabel(doc.type)}</div>
		<div class="fw-bold text-dark">{doc.name}</div>
	</div>
	<TooltipSquareIconLink class="me-n2" href={doc.url} download icon="cloud-download-alt" hoverText={m.documents_download()} blank />
</li>