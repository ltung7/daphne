/**
 * Full FCM Message type definition for admin.messaging().send()
 * Recreated from Firebase Admin SDK v13.7.0 types without referencing existing types.
 */

export interface FcmBaseMessage {
  /** Arbitrary key/value payload, all values must be strings */
  data?: Record<string, string>;
  /** Basic notification payload (title, body, imageUrl) */
  notification?: FcmNotification;
  /** Android-specific configuration */
  android?: AndroidConfig;
  /** Web Push-specific configuration */
  webpush?: WebpushConfig;
  /** APNs-specific configuration */
  apns?: ApnsConfig;
  /** Cross-platform FCM options */
  fcmOptions?: FcmOptions;
}

export interface TokenMessage extends FcmBaseMessage {
  /** Target device registration token */
  token: string;
}

export interface TopicMessage extends FcmBaseMessage {
  /** Target topic name */
  topic: string;
}

export interface ConditionMessage extends FcmBaseMessage {
  /** Target condition expression (e.g., "'topic1' in topics || 'topic2' in topics") */
  condition: string;
}

/** Main message type accepted by admin.messaging().send() */
export type FcmMessage = TokenMessage | TopicMessage | ConditionMessage;

/** Multicast message for sendEachForMulticast() */
export interface MulticastMessage extends FcmBaseMessage {
  /** Array of target device registration tokens (max 500) */
  tokens: string[];
}

export interface FcmNotification {
  /** Notification title */
  title?: string;
  /** Notification body text */
  body?: string;
  /** URL of image to display in notification */
  imageUrl?: string;
}

export interface FcmOptions {
  /** Analytics label for message */
  analyticsLabel?: string;
}

export interface WebpushConfig {
  /** Web Push HTTP headers */
  headers?: Record<string, string>;
  /** Web Push data payload */
  data?: Record<string, string>;
  /** Web Push notification payload */
  notification?: WebpushNotification;
  /** Web Push FCM options */
  fcmOptions?: WebpushFcmOptions;
}

export interface WebpushFcmOptions {
  /** Link to open when notification is clicked (HTTPS required) */
  link?: string;
}

export interface WebpushNotification {
  /** Notification title */
  title?: string;
  /** Action buttons for notification */
  actions?: Array<{
    /** Action identifier */
    action: string;
    /** Action icon URL */
    icon?: string;
    /** Action button title */
    title: string;
  }>;
  /** Badge icon URL */
  badge?: string;
  /** Notification body text */
  body?: string;
  /** Arbitrary data */
  data?: any;
  /** Text direction */
  dir?: 'auto' | 'ltr' | 'rtl';
  /** Notification icon URL */
  icon?: string;
  /** Image URL */
  image?: string;
  /** Language tag (BCP 47) */
  lang?: string;
  /** Renotify on replacement */
  renotify?: boolean;
  /** Require user interaction */
  requireInteraction?: boolean;
  /** Silent notification */
  silent?: boolean;
  /** Notification tag for replacement */
  tag?: string;
  /** Timestamp (epoch ms) */
  timestamp?: number;
  /** Vibration pattern */
  vibrate?: number | number[];
  /** Additional properties */
  [key: string]: any;
}

export interface ApnsConfig {
  /** Live Activity token */
  liveActivityToken?: string;
  /** APNs HTTP headers */
  headers?: Record<string, string>;
  /** APNs payload */
  payload?: ApnsPayload;
  /** APNs FCM options */
  fcmOptions?: ApnsFcmOptions;
}

export interface ApnsPayload {
  /** APNs aps dictionary */
  aps: Aps;
  /** Custom payload keys */
  [customData: string]: any;
}

export interface Aps {
  /** Alert payload (string or object) */
  alert?: string | ApsAlert;
  /** Badge number */
  badge?: number;
  /** Sound name or critical sound config */
  sound?: string | CriticalSound;
  /** Content available flag (background wake) */
  contentAvailable?: boolean;
  /** Mutable content flag */
  mutableContent?: boolean;
  /** Notification category */
  category?: string;
  /** Thread identifier */
  threadId?: string;
  /** Custom aps keys */
  [customData: string]: any;
}

export interface ApsAlert {
  /** Alert title */
  title?: string;
  /** Alert subtitle */
  subtitle?: string;
  /** Alert body */
  body?: string;
  /** Localization key */
  locKey?: string;
  /** Localization args */
  locArgs?: string[];
  /** Title localization key */
  titleLocKey?: string;
  /** Title localization args */
  titleLocArgs?: string[];
  /** Subtitle localization key */
  subtitleLocKey?: string;
  /** Subtitle localization args */
  subtitleLocArgs?: string[];
  /** Action button localization key */
  actionLocKey?: string;
  /** Launch image URL */
  launchImage?: string;
}

export interface CriticalSound {
  /** Critical alert flag */
  critical?: boolean;
  /** Sound file name */
  name: string;
  /** Volume (0.0 - 1.0) */
  volume?: number;
}

export interface ApnsFcmOptions {
  /** Analytics label */
  analyticsLabel?: string;
  /** Image URL */
  imageUrl?: string;
}

export interface AndroidConfig {
  /** Collapse key */
  collapseKey?: string;
  /** Message priority */
  priority?: 'high' | 'normal';
  /** Time-to-live in milliseconds */
  ttl?: number;
  /** Restricted package name */
  restrictedPackageName?: string;
  /** Android-specific data payload */
  data?: Record<string, string>;
  /** Android notification config */
  notification?: AndroidNotification;
  /** Android FCM options */
  fcmOptions?: AndroidFcmOptions;
  /** Direct boot OK */
  directBootOk?: boolean;
}

export interface AndroidNotification {
  /** Notification title */
  title?: string;
  /** Notification body */
  body?: string;
  /** Icon resource name */
  icon?: string;
  /** Icon color (#rrggbb) */
  color?: string;
  /** Sound file name */
  sound?: string;
  /** Notification tag */
  tag?: string;
  /** Image URL */
  imageUrl?: string;
  /** Click action */
  clickAction?: string;
  /** Body localization key */
  bodyLocKey?: string;
  /** Body localization args */
  bodyLocArgs?: string[];
  /** Title localization key */
  titleLocKey?: string;
  /** Title localization args */
  titleLocArgs?: string[];
  /** Channel ID (Android O+) */
  channelId?: string;
  /** Ticker text */
  ticker?: string;
  /** Sticky notification */
  sticky?: boolean;
  /** Event timestamp */
  eventTimestamp?: Date;
  /** Local only */
  localOnly?: boolean;
  /** Notification priority */
  priority?: 'min' | 'low' | 'default' | 'high' | 'max';
  /** Vibration timings (ms) */
  vibrateTimingsMillis?: number[];
  /** Default vibration timings */
  defaultVibrateTimings?: boolean;
  /** Default sound */
  defaultSound?: boolean;
  /** LED light settings */
  lightSettings?: LightSettings;
  /** Default light settings */
  defaultLightSettings?: boolean;
  /** Visibility */
  visibility?: 'private' | 'public' | 'secret';
  /** Notification count */
  notificationCount?: number;
  /** Proxy setting */
  proxy?: 'allow' | 'deny' | 'if_priority_lowered';
}

export interface LightSettings {
  /** LED color (#rrggbb or #rrggbbaa) */
  color: string;
  /** Light on duration (ms) */
  lightOnDurationMillis: number;
  /** Light off duration (ms) */
  lightOffDurationMillis: number;
}

export interface AndroidFcmOptions {
  /** Analytics label */
  analyticsLabel?: string;
}

/** Legacy payload types (for reference) */
export interface DataMessagePayload {
  [key: string]: string;
}

export interface NotificationMessagePayload {
  tag?: string;
  body?: string;
  icon?: string;
  badge?: string;
  color?: string;
  sound?: string;
  title?: string;
  bodyLocKey?: string;
  bodyLocArgs?: string;
  clickAction?: string;
  titleLocKey?: string;
  titleLocArgs?: string;
  [key: string]: string | undefined;
}

export interface MessagingPayload {
  data?: DataMessagePayload;
  notification?: NotificationMessagePayload;
}

export interface MessagingOptions {
  dryRun?: boolean;
  priority?: string;
  timeToLive?: number;
  collapseKey?: string;
  mutableContent?: boolean;
  contentAvailable?: boolean;
  restrictedPackageName?: string;
  [key: string]: any | undefined;
}