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
		enum Status {
			Available = 'available',
			Assigned = 'assigned',
			Broken = 'broken',
			Unmovable = 'unmovable',
			UnderMaintenance = 'under_maintenance',
			Retired = 'retired'
		}

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
			spec: {
				maxPassengers: number; // e.g., 5
				premium: boolean;
				xl: boolean;
				eco: boolean;
				foodDelivery: boolean;
			};

			// Optional Metadata
			notes?: string;
		}

		interface Vehicle {
			// Identification
			id: string; // System-generated UUID
			registrationNumber: string; // Polish VIN/license plate (UNIQUE per vehicle)
			vin: string; // Full VIN (can be optional for legacy)
			firstRegistrationDate: string; // ISO date (YYYY-MM-DD)
			imageUrl?: string; // Photo reference

			// Current State
			status: Status; // available | assigned | broken | unmovable | etc.
			assignedDriver?: string; // Driver ID if currently assigned

			// Instance-Specific Metrics
			mileage: number; // Kilometers driven (kms)
			fuelConsumption: number; // L/100km avg for this vehicle
			batteryHealth?: number; // % (for electric/hybrid)

			// Digital Identity
			telemetryId: string; // GPS/telematics tracking ID

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
			deliveryTrips?: {
				completed: number;
				totalDeliveryFees: number; // In PLN
			};

			// Platform References
			type: Type; // Reference to the shared blueprint (was VehicleType)
			insuranceExpiration: string; // ISO date (YYYY-MM-DD)
			technicalExpiration: string; // ISO date (badanie techniczne)

			// Optional additional data
			notes?: string;
		}
	}

	namespace Driver {
		interface Data {
			id: string; // Unique identifier (PESEL or system-generated)
			login: string;
			password: string;
			name: string;
			profileImageUrl: string;
			sex: 'm' | 'f' | 'o'

			// Contact Data
			contact: {
				phone: string; // Main contact number
				email: string;
				address: string; // Required for delivery addresses
			};

			// Driving Licence Data (Uber/Bolt + Taxi)
			licenses: {
				carDrivingLicense: {
					number: string; // Unique license number
					expirationDate: string; // ISO date string (YYYY-MM-DD)
					category: string; // e.g., "B", "C", "D" - driving licence category
				};
				motorcycleDrivingLicense: {
					number: string; // Unique license number
					expirationDate: string; // ISO date string (YYYY-MM-DD)
					category: string; // e.g., "A", "A1" - motorcycle licence category
				};
				taxiLicense?: {
					number: string; // Specific to taxi operations
					expirationDate: string; // ISO date string
				};
			};

			// KPI Metrics (Critical for provider scoring)
			kpis: {
				tripsCompleted: number; // Total trips driven
				earnings: number; // In grosze (PLN * 100) for precise calculations
				safetyScore: number; // 0-100 based on incident reports
				uptimePercentage: number; // % of scheduled shifts completed
			};

			// Platform-Specific Optimization Data
			optimization: {
				experience: number; // Hours of platform experience
				polishLanguage: 'native' | 'fluent' | 'basic'; // Required for polish-speaking passengers
				additionalLanguages?: { [language: string]: 'native' | 'fluent' };
				passengerRatings: number; // Average rating from users
			};

			// Financial Tracking
			balance: number; // In grosze (PLN * 100) - never use floating point
			pendingWithdrawals: number; // Pending withdrawals in grosze

			// Current Vehicle Assignment
			assignedVehicle?: {
				registrationNumber: string; // Polish VIN/ registration
				model: string; // e.g., "Toyota Yaris"
				imageUrl: string; // URL to vehicle image
			};

			// Status Flags
			status: Status; // Must match enum above
		}
	}

	namespace SvelteCustom {
		type DatatableHeaders = [string, string][];

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