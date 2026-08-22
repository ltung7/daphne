// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
	type ExplicitAnyToExtend = any;
	type ExplicitAnyToTest = any;

	namespace App {
		interface Error {
			message: string;
			account?: string;
			[key: string]: unknown;
		}

		interface Locals {
			admin: boolean;
			subRoute?: string | undefined,
			auth: BaseUserData;
		}

		type UserRoles = 'admin' | 'streamer' | 'revoked' | 'superadmin';

		interface BaseUserData {
			user: string;
			role: UserRoles;
			accounts: string[]
			theme?: string;
		}

		interface User {
			login: string;
			role: UserRoles;
			password?: string;
			accounts: string[]
		}

		/**
		 * Generic Firestore query element.
		 * K is a string key (defaults to `string`). The value is kept as `any` to retain current flexibility.
		 */
		type FirebaseQueryElement<K extends string = string> = [K, '==', any];

		/**
		 * Generic Firestore items query.
		 * Allows a map of field/value pairs where keys are of type K, a single query element, or `false`.
		 * Defaults to `string` for full backward compatibility.
		 */
		type FirebaseItemsQuery<K extends string = string> = Partial<Record<K, any>> | FirebaseQueryElement<K> | false;

		/**
		 * Generic Firestore query list.
		 * Allows either a map of field/value pairs (keys of type K) or an array of generic query elements.
		 */
		type FirebaseQueryList<K extends string = string> = Record<K, any> | Array<FirebaseQueryElement<K>>;

		/**
		 * Generic Firestore items fields list.
		 * An array of field keys of type K (defaults to string) or false.
		 */
		type FirebaseItemsFields<K extends string = string> = Array<K> | false;

		/**
		 * Generic Firestore order query.
		 * Specifies a field key of type K (defaults to string) and direction.
		 */
		type FirebaseOrderQuery<K extends string = string> = [K, 'asc' | 'desc'] | false;
	}

	namespace Vehicle {
		type Status = 'available' | 'assigned' | 'broken' | 'unmovable' | 'under_maintenance' | 'retired' | 'precheck';

		type FuelType = "gas" | "hybrid" | "electric" | "phev" | "mhev" | "diesel" | "cng" | "hybrid-gas" | "mhev-diesel" | "ethanol" | "hybrid-diesel" | "lpg" | "hydrogen";

		interface Type {
			id: string;
			// Common Configuration (shared across all instances)
			name: string;
			makeModel: string; // e.g., "Toyota Prius", "Kawasaki Ninja 650"
			fuelType: FuelType;
			taxClass: string; // e.g., "B", "A1", "A"
			image: string;

			// Platform Configurations
			maxPassengers: number; // e.g., 5
			premium: boolean;
			xl: boolean;
			eco: boolean;
			foodDelivery: boolean;

			// Optional Metadata
			notes: string;
		}

		interface NewVehicleData {
			// Identification
			id: string;
			name: string;
			registrationNumber: string; // Polish VIN/license plate (UNIQUE per vehicle)
			vin: string; // Full VIN (can be optional for legacy)
			firstRegistrationDate: string; // ISO date (YYYY-MM-DD)

			// Instance-Specific Metrics
			mileage: number; // Kilometers driven (kms)
			insuranceExpiration: string; // ISO date (YYYY-MM-DD)
			technicalExpiration: string; // ISO date (badanie techniczne)

			notes: string;
			modelMake: string;
			typeId: string; // Reference to the shared blueprint (was VehicleType)
		}

		interface Vehicle extends NewVehicleData {
			imageUrl?: string; // Photo reference

			// Current State
			status: Status; // available | assigned | broken | unmovable | etc.
			assignedDriver?: string; // Driver ID if currently assigned
			fuelConsumption?: number; // L/100km avg for this vehicle
			taxiRegistration?: number;

			// Digital Identity
			telemetryId?: string; // GPS/telematics tracking ID

			// Financial
			fuelCardId?: string; // Unique fuel card attached
			leaseCost?: {
				monthly: number; // PLN
				totalRemaining: number;
			};

			// Platform Usage (per-instance tracking)
			uberBoltTrips: {
				totalTrips: number;
				totalEarnings: number; // In grosze
				avgDriverRating: number; // 0-5 scale
				avgPassengerRating: number; // 0-5 scale
			};

			// Food Delivery (optional, per-instance)
			deliveryTrips: {
				completed: number;
				totalDeliveryFees: number; // In PLN
			};

			platformStatus: {
				[platform: string]: 'pending' | 'approved' | 'rejected' | 'suspended';
			};
		}

		type VehicleRequirementVerification = Vehicle & Type;

		type DocumentType =
			// Registration & ownership
			| 'registration_certificate'
			| 'ownership_proof'
			| 'lease_agreement'
			| 'taxi_license_excerpt'

			// Insurance
			| 'oc_insurance_policy'
			| 'ac_insurance_policy'

			// Technical / safety
			| 'technical_inspection_certificate'
			| 'internal_checkup_report'
			| 'damage_incident_report'
			| 'vehicle_history'

			// Fleet-level licensing
			| 'fleet_taxi_license'
			| 'taxi_marking_confirmation'

			// Platform onboarding
			| 'vehicle_photo_exterior'
			| 'vehicle_photo_interior'
			| 'platform_approval_uber'
			| 'platform_approval_bolt'
			| 'platform_approval_freenow'

			// Equipment
			| 'telematics_installation_certificate'
			| 'fuel_card_agreement'
			| 'taximeter_legalization_certificate'

		interface VehicleDocument {
			id: string;
			timestamp: number;              // epoch ms, upload time
			uploader: string;                // user/account ID who uploaded it
			type: DocumentType;
			registrationNumber: string;      // links to Vehicle
			name: string;
			url: string;
		}
	}

	namespace RideServices {
		type Provider = 'Uber' | 'Bolt' | 'FreeNow' | 'iTaxi';

		type CalculationMethod = 'days' | 'number' | 'years';

		interface BaseRequirement {
			node: RideServices.VerificationState;
			name: string;
			text: string;
			service: Provider[];
		}

		interface DocumentRequirement extends BaseRequirement {
			type: 'document';
			document: Vehicle.DocumentType;
		}

		interface CheckRequirement extends BaseRequirement {
			type: 'check';
			variable?: keyof Vehicle.VehicleRequirementVerification;
		}

		interface CalculateRequirement extends BaseRequirement {
			type: 'calculate';
			calculation_method: CalculationMethod;
			value: number;
			variable: keyof Vehicle.VehicleRequirementVerification;
		}

		// Full array item type
		type RequirementItem =
			| DocumentRequirement
			| CheckRequirement
			| CalculateRequirement;

		type VerificationState =
			| 'registrationCertificateStamped'
			| 'taxiLicenseExcerpt'
			| 'ocInsurancePolicy'
			| 'technicalInspectionCertificate'
			| 'vehicleVerificationPhotos'
			| 'taximeterLegalizationCertificate'
			| 'warsawSideStripesCheck'
			| 'warsawCoatOfArmsCheck'
			| 'warsawSideNumberCheck'
			| 'tariffCardCheck'
			| 'rooftopLampCheck'
			| 'driverIdDisplayCheck'
			| 'virtualCashRegisterActive'
			| 'hardwareTaximeterInstalled'
			| 'bodyworkConditionCheck'
			| 'leftHandDriveCheck'
			| 'telemetryHardwareInstallation'
			| 'telemetrySystemAssignment'
			| 'fuelCardAssignment'
			| 'maxVehicleAgeStandardUberBolt'
			| 'maxVehicleAgeStandardFreeNow'
			| 'maxVehicleAgeStandardITaxi'
			| 'maxVehicleAgeComfortUberBolt'
			| 'maxVehicleAgeComfortFreeNow'
			| 'ocInsuranceExpirationBuffer'
			| 'technicalInspectionExpirationBuffer'
			| 'minPassengerCapacity';
	}

	namespace Driver {
		type DriverStatusType =
			| 'pending_verification'
			| 'rejected'
			| 'active'
			| 'inactive'
			| 'documents_expiring'
			| 'documents_expired'
			| 'suspended'
			| 'banned'
			| 'archived';

		type DrivingLicenseCategory =
			| 'AM' | 'A1' | 'A2' | 'A'   // mopeds / motorcycles
			| 'B1' | 'B' | 'B+E'          // cars
			| 'C1' | 'C1+E' | 'C' | 'C+E'  // trucks
			| 'D1' | 'D1+E' | 'D' | 'D+E'  // buses
			| 'T';                        // tractors/agricultural

		interface DrivingLicense {
			number: string;
			category: DrivingLicenseCategory;
			expirationDate: string;     // ISO date
			issuingCountry: string;    // default 'PL', relevant for foreign drivers
		}

		/**
		 * Identity document types legally acceptable for driver identification in Poland.
		 * Based on the Polish Passport Documents Act (ustawa o dokumentach paszportowych)
		 * and the Foreigners Act (ustawa o cudzoziemcach).
		 */
		type IdentificationDocumentType =
			| 'polish_id_card'          // Dowód osobisty — Polish identity card
			| 'passport'                // Paszport — Polish or foreign passport
			| 'residence_card'          // Karta pobytu — residence card (EU / foreign national)
			| 'temporary_residence_card' // Tymczasowa karta pobytu — temporary residence card
			| 'travel_document';        // Document podróży — travel document issued to foreigners

		interface TaxiAuthorization {
			registryEntryNumber: string;
			market: string;       // issuing gmina/city
			expirationDate: string;
		}

		// --- What you actually collect when onboarding a driver ---

		interface NewDriverData {
			id: string;
			login: string;
			name: string;
			sex: 'm' | 'f' | 'o';

			// Contact Data
			phone: string;
			email: string;
			address: string;

			// Licensing
			drivingLicenses: DrivingLicense[];
			nationality: string; // ISO 3166-1 alpha-2, e.g. 'PL'
			identificationDocumentType: IdentificationDocumentType;
			identificationDocumentNumber: string;
			taxiAuthorization?: TaxiAuthorization; // only present if driver does taxi/rideshare work

			// Declared language skills (accrued stats like experience/ratings live on Driver)
			polishLanguage: 'native' | 'fluent' | 'basic';
			additionalLanguages: { [language: string]: 'native' | 'fluent' };

			notes: string; // optional intake notes
		}

		// --- Full driver record, once account is active ---

		interface Driver extends NewDriverData {
			password: string;
			profileImageUrl: string;

			// KPI Metrics (Critical for provider scoring)
			tripsCompleted: number;     // Total trips driven
			earnings: number;           // In grosze (PLN * 100)
			safetyScore: number;        // 0-100 based on incident reports
			uptimePercentage: number;   // % of scheduled shifts completed

			// Platform-Specific Optimization Data (accrued over time)
			experience: number;         // Hours of platform experience
			passengerRatings: number;   // Average rating from users

			// Financial Tracking
			balance: number;            // In grosze (PLN * 100) - never use floating point
			pendingWithdrawals: number; // Pending withdrawals in grosze

			// Current Vehicle Assignment
			assignedVehicle: false | {
				registrationNumber: string; // Polish registration number
				model: string;              // e.g., "Toyota Yaris"
				imageUrl: string;           // URL to vehicle image
				date: string;
			}

			status: DriverStatusType; // Must match enum defined elsewhere
		}
	}

	namespace DocumentGenerator {
		type Locale = 'pl' | 'en' | 'uk' | 'be' | 'ne';
		
		interface HandoverDocument {
			place: string
			date: string
			owner: string;
			managerName: string
			managerEmail: string;
			driverName: string;
			driverEmail: string;
			driverIdentification: string;
			model: string
			registrationNumber: string
			vin: string
			milage: string
			remaining: string
			visual: string
			isElectric: boolean
			locale?: DocumentGenerator.Locale
			send?: boolean;
			key: boolean
			spareKey: boolean
			registration: boolean
			roofSign: boolean
			tire: boolean
			fuelCard: boolean
			exinguisher: boolean
			triangle: boolean
			firstAidKit: boolean
			vest: boolean
			mats: boolean
			phoneHolder: boolean
			phoneCharger: boolean
			carWashCard: boolean
		}
	}

	namespace SvelteCustom {
		type DatatableHeaders<T = string> = [T, string][];

		type DatatableRangeFilterOption = { min: number, max: number };

		type DatatableRangeFilter = [string, string | DatatableRangeFilterOption][];

		interface ExtendedConfigsStub {
			dirty: Set<string>;
			account: string;
			adapter: string;
		}

		interface ExtendedConfigs extends ExtendedConfigsStub {
			_: boolean;
		}

		interface CustomConfigNode {
			type: 'link' | 'boolean' | 'action' | 'number' | 'list' | 'string' | 'color';
			node: string;
			caption: string;
			description: string;
			admin?: boolean;
			sub?: CustomConfigNode[];
			min?: number;
			max?: number;
			icon?: string;
			link?: string;
			options?: Record<string, string>;
			html?: string;
			adapters?: string[];
			default?: any;
		}

		interface BaseBlueprint {
			[key: string]: SvelteCustom.CustomConfigNode[] | Record<string, ExplicitAnyToExtend> | ExplicitAnyToExtend;
		}

		interface ConfigsBlueprintNode {
			caption: string;
			anchor: string;
			description: string;
			icon: string;
			customNodes?: string[];
			nodes: SvelteCustom.CustomConfigNode[];
		}

		interface ConfigsBlueprint<T extends string> {
			nodes: Record<T, ConfigsBlueprintNode>;
			customComponents?: Record<string, SvelteCustom.CustomConfigNode>;
		}

		type ExtractStandardNodes<T extends BaseBlueprint> = {
			[K in keyof T]: T[K] extends SvelteCustom.CustomConfigNode[] ? K : never;
		}[keyof T];

		type ExtractStandardConfigs<T extends ConfigsBlueprint> = {
			[K in keyof T['nodes']]: T['nodes'][K] extends SvelteCustom.CustomConfigNode[] ? K : never;
		}[keyof T];

		interface CustomConfigsComponent {
			component: ComponentType<SvelteComponent>;
			params: Record<string, any>;
		}

		interface CustomConfigComponentsList {
			[key: string]: CustomConfigsComponent
		}

		type DragBoxCheckDroppable = false | ((params?: ExplicitAnyToExtend) => boolean);

		type DragBoxStart = (item: string, from: string) => (event: DragEvent) => void;

		type DragBoxEnd = () => void;

		type DragBoxDrop = (event: DragEvent | ExplicitAnyToExtend, index: string, dragHoverItem: string, from: string) => void;

		type DragMoveBetweenArrays<T, R = Record<string, T[]>> = (item: T, indexForm: keyof R, indexTo: keyof R, arrays: R, itemIndex: ((keyof T) | undefined)) => R;
	}

}

export { };