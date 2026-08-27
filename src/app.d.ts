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

		interface DownloadableDocument {
			id: string;
			timestamp: number;              // epoch ms, upload time
			uploader: string;                // user/account ID who uploaded it
			name: string;
			url: string;
		}

		type BucketName = "feed-cdn-files" | "mpt_tmp_imgs";
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
			assignedDriverName?: string; // Driver name if currently assigned
			assignedDriverId?: string; // Driver ID if currently assigned
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

			// VehicleManagement
			| 'vehicle_handover_document'
			| 'vehicle_handover_return_document'
			| 'vehicle_handover_unilateral_document'

		interface VehicleDocument extends App.DownloadableDocument {
			type: DocumentType;
			registrationNumber: string;      // links to Vehicle
		}

		type HandoverDocumentType = 'assign' | 'return' | 'unilateral';

		interface VehicleAssignmentData {
			registrationNumber: string;
			driverId: string;
			handoverId: string;
			timestamp: number;
			type: 'assign' | 'return' | 'unilateral'
		}
	}

	namespace RideServices {
		type Provider = 'Uber' | 'Bolt' | 'FreeNow' | 'iTaxi';

		type CalculationMethod = 'days' | 'number' | 'years';

		// Generic base requirement with type parameters
		interface BaseRequirement<
			TVerificationState extends string,
			TDocumentType extends string,
			TVehicleRequirementVerification
		> {
			node: TVerificationState;
			name: string;
			text: string;
			service: Provider[] | [ 'System' ];
			required?: boolean;
		}

		interface DocumentRequirement<
			TVerificationState extends string,
			TDocumentType extends string,
			TVehicleRequirementVerification
		> extends BaseRequirement<TVerificationState, TDocumentType, TVehicleRequirementVerification> {
			type: 'document';
			document: TDocumentType;
		}

		interface CheckRequirement<
			TVerificationState extends string,
			TDocumentType extends string,
			TVehicleRequirementVerification
		> extends BaseRequirement<TVerificationState, TDocumentType, TVehicleRequirementVerification> {
			type: 'check';
			variable?: keyof TVehicleRequirementVerification;
		}

		interface CalculateRequirement<
			TVerificationState extends string,
			TDocumentType extends string,
			TVehicleRequirementVerification
		> extends BaseRequirement<TVerificationState, TDocumentType, TVehicleRequirementVerification> {
			type: 'calculate';
			calculation_method: CalculationMethod;
			value: number;
			variable: keyof TVehicleRequirementVerification;
		}

		// Full array item type
		type RequirementItem<
			TVerificationState extends string,
			TDocumentType extends string,
			TVehicleRequirementVerification
		> =
			| DocumentRequirement<TVerificationState, TDocumentType, TVehicleRequirementVerification>
			| CheckRequirement<TVerificationState, TDocumentType, TVehicleRequirementVerification>
			| CalculateRequirement<TVerificationState, TDocumentType, TVehicleRequirementVerification>;

		// Specific types for vehicle requirements
		type VehicleVerificationState =
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

		// Specific requirement item type for vehicles
		type VehicleRequirementItem = RequirementItem<
			VehicleVerificationState,
			Vehicle.DocumentType,
			Vehicle.VehicleRequirementVerification
		>;

		// Driver verification state
		type DriverVerificationState =
			| 'drivingLicenseFront'
			| 'drivingLicenseBack'
			| 'idCardFront'
			| 'idCardBack'
			| 'residencePermitFront'
			| 'residencePermitBack'
			| 'passportMainPage'
			| 'polishCriminalRecordCertificate'
			| 'foreignCriminalRecordCertificate'
			| 'medicalCertificate'
			| 'psychologicalCertificate'
			| 'taxiDriverIdFront'
			| 'taxiDriverIdBack'
			| 'taxiDriverIdDecision';

		// Specific requirement item type for drivers
		type DriverRequirementItem = RequirementItem<
			DriverVerificationState,
			Driver.DocumentType,
			Driver.DriverRequirementVerification
		>;
	}

	namespace Driver {
		type Status =
			| 'pending_verification'
			| 'rejected'
			| 'available'
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
			pesel: string;

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
			balance: number;
			cashBalance: number;

			pendingWithdrawals: number; // Pending withdrawals in grosze

			// Current Vehicle Assignment
			assignedVehicle: false | {
				registrationNumber: string; // Polish registration number
				model: string;              // e.g., "Toyota Yaris"
				imageUrl?: string;           // URL to vehicle image
				timestamp: number;
			}

			status: Status; // Must match enum defined elsewhere
		}

		type DocumentType =
			// Driving qualifications
			| 'driving_license_front'
			| 'driving_license_back'

			// Personal identification
			| 'id_card_front'
			| 'id_card_back'
			| 'residence_permit_front'
			| 'residence_permit_back'
			| 'passport_main_page'

			// Background checks
			| 'polish_criminal_record_certificate'
			| 'foreign_criminal_record_certificate'

			// Medical approvals
			| 'medical_certificate'
			| 'psychological_certificate'

			// City TAXI permissions
			| 'taxi_driver_id_front'
			| 'taxi_driver_id_back'
			| 'taxi_driver_id_decision'

		interface DriverDocument extends App.DownloadableDocument {
			type: DocumentType;
			driverId: string;
		}

		// Type for driver requirement verification (extends Driver with license data)
		type DriverRequirementVerification = Driver & {
			drivingLicenses: DrivingLicense[];
		};
	}

	namespace DocumentGenerator {
		type Locale = 'pl' | 'en' | 'uk' | 'be' | 'ne' | 'cs';

		interface HandoverDocument {
			place: string
			date: string
			owner: string;
			managerName: string
			managerEmail: string;
			driverName: string;
			driverEmail: string;
			driverId: string;
			identificationDocumentType: IdentificationDocumentType;
			identificationDocumentNumber: string;
			model: string
			registrationNumber: string
			vin: string
			milage: string
			remaining: string
			visual: string
			translatedVisual: string
			isElectric: boolean
			locale: DocumentGenerator.Locale
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
			images: string[]
		}

		interface HandoverDocumentRecord extends HandoverDocument {
			id: string;
			timestamp: number;
			manualClose: boolean;
			type: Vehicle.HandoverDocumentType;
			docusignId?: string;
			docusignSent?: number;
			docusignSigned?: number;
			printed?: number;
			closed: false | number;
			url?: string;
		}

		type HandoverImageType = 'signedprintout' | 'image';

		interface HandoverImage extends App.DownloadableDocument {
			type: HandoverImageType;
			handoverId: string;
		}

		interface HandoverDocumentTranslations {
			title: string
			handoverSubtitle: string
			returnSubtitle: string
			unilateralSubtitle: string
			recoveryLocation: string
			witness: string
			reasonForRecovery: string
			section1Header: string
			place: string
			date: string
			manager: string
			retriever: string
			driver: string
			section2Header: string
			model: string
			plate: string
			mileage: string
			fuel: string
			battery: string
			section3Header: string
			equipmentKey: string
			equipmentSpareKey: string
			equipmentRegistration: string
			equipmentRoofSign: string
			equipmentTire: string
			equipmentFuelCard: string
			equipmentCarWashCard: string
			equipmentExtinguisher: string
			equipmentTriangle: string
			equipmentVest: string
			equipmentFirstAidKit: string
			equipmentMats: string
			equipmentPhoneHolder: string
			equipmentPhoneCharger: string
			section4Header: string
			section4Paragraph: string
			section5Header: string
			handoverClauses: string[]
			returnClauses: string[]
			unilateralClauses: string[]
			signatureDriver: string
			signatureManager: string
			signatureWitness: string
			signatureRetriever: string
			imagesAttachment: string;
			imagesAttachmentHeader: string;
			imagesAttachmentText: string;
			imageNumer: string;
			_foreign?: HandoverDocumentTranslations
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