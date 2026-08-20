export enum FUEL_TYPE {
    Gasoline = "gasoline",
    Hybrid = "hybrid",
    Electric = "electric",
    PlugInHybrid = "phev",
    MildHybrid = "mhev",
    Diesel = "diesel",
    NaturalGas = "cng",
    HybridGasoline = "hybrid-gasoline",
    MildHybridDiesel = "mhev-diesel",
    Ethanol = "ethanol",
    HybridDiesel = "hybrid-diesel",
    Lpg = "lpg",
    Hydrogen = "hydrogen"
}

export enum VEHICLE_STATUS {
    Available = 'available',
    Assigned = 'assigned',
    Broken = 'broken',
    Unmovable = 'unmovable',
    UnderMaintenance = 'under_maintenance',
    Retired = 'retired',
    Precheck = 'precheck',
}

export const ECO_FUEL_TYPES: Vehicle.FuelType[] = [
    "electric",
    "hybrid",
    "phev",
    "hybrid-gas",
    "hybrid-diesel",
    "hydrogen",
];

export enum VEHICLE_DOCUMENT_TYPE {
    REGISTRATION_CERTIFICATE = 'registration_certificate',
    OWNERSHIP_PROOF = 'ownership_proof',
    LEASE_AGREEMENT = 'lease_agreement',

    OC_INSURANCE_POLICY = 'oc_insurance_policy',
    AC_INSURANCE_POLICY = 'ac_insurance_policy',

    TECHNICAL_INSPECTION_CERTIFICATE = 'technical_inspection_certificate',
    INTERNAL_CHECKUP_REPORT = 'internal_checkup_report',
    DAMAGE_INCIDENT_REPORT = 'damage_incident_report',

    FLEET_TAXI_LICENSE = 'fleet_taxi_license',
    TAXI_MARKING_CONFIRMATION = 'taxi_marking_confirmation',

    VEHICLE_PHOTO_EXTERIOR = 'vehicle_photo_exterior',
    VEHICLE_PHOTO_INTERIOR = 'vehicle_photo_interior',
    PLATFORM_APPROVAL_UBER = 'platform_approval_uber',
    PLATFORM_APPROVAL_BOLT = 'platform_approval_bolt',
    PLATFORM_APPROVAL_FREENOW = 'platform_approval_freenow',

    TELEMATICS_INSTALLATION_CERTIFICATE = 'telematics_installation_certificate',
    FUEL_CARD_AGREEMENT = 'fuel_card_agreement',
}

export enum SERVICE_PROVIDERS {
    Uber = 'Uber',
    Bolt = 'Bolt',
    FreeNow = 'FreeNow',
    iTaxi = 'iTaxi',
}

export enum DRIVER_STATUS {
    // Onboarding
    PendingVerification = 'pending_verification', // documents submitted, awaiting review
    Rejected = 'rejected',                         // failed onboarding checks

    // Normal lifecycle
    Active = 'active',                             // approved, eligible to drive
    Inactive = 'inactive',                         // driver-initiated pause (e.g. vacation)

    // Compliance/expiry driven
    DocumentsExpiring = 'documents_expiring',       // license/authorization nearing expiry, still allowed to drive but flagged
    DocumentsExpired = 'documents_expired',         // blocked from driving until renewed

    // Admin action
    Suspended = 'suspended',                       // temporary block, e.g. investigation or policy violation
    Banned = 'banned',                             // permanent removal from platform

    // Terminal
    Archived = 'archived',                         // account closed/deleted, kept for records
}