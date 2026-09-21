# Handover Return Flow & Camera System Rework Plan

## Current State

### What Works (Assignment Flow)
- **Assignment handover** (`NewHandoverProtocol.svelte`): Creates "assign" type handover → on "close" action calls `assignVehicleAndCloseHandover()` → atomically updates vehicle + driver + creates vehicleAssignment record + closes handover
- **API**: `POST /handovers/new/api` with `action: 'close'` handles assignment
- **UI**: Opens from driver detail page when no vehicle assigned (`handoverModal = true` with driver prop)

### What's Missing (Return Flow)
- **No return handover type** in API — `handover.zod.ts` only has one schema; `vehicleHandovers` records have `type: 'assign'` hardcoded
- **No return UI trigger** — When vehicle IS assigned, the "Przypisz" button shows but there's no "Zwróć pojazd" button
- **No return API endpoint** — `vehicleStatus.service.ts:returnVehicle()` exists but not wired to any handover API
- **Return document generator exists** (`handover-return.document.ts`) but unused

### Camera System (Needs Rework)
- **`CameraCapture.svelte`** — Basic camera capture, used in `UploadHandoverImages.svelte`
- **`CameraCaptureSeries.svelte`** — Multi-step guided capture (used for inspections)
- **`MobileCameraCapture.svelte`** — Mobile-optimized version with i18n
- **Issues to fix**:
  - No consistent photo categories/types for handovers (exterior, interior, damage, equipment, odometer)
  - Photos stored as generic `images: string[]` in handover schema — no structure
  - No backend processing (compression, thumbnails, EXIF stripping)
  - Upload flow uses temp bucket (`mpt_tmp_imgs`) then manual move — should be direct to final bucket
  - No offline/caching support for poor connectivity during handovers

---

## Required Work

### 1. Handover Return Flow

#### 1.1 Data Model & Schema
- [ ] Add `type` field to handover schema (`'assign' | 'return' | 'unilateral'`) in `handover.zod.ts`
- [ ] Update `vehicleHandovers.fdb.ts` to store `type` field
- [ ] Add `returnedAt` timestamp to handover record (already in `returnVehicle()` but not in schema)
- [ ] Create separate return handover schema if fields differ (mileage, fuel, condition notes, equipment checklist)

#### 1.2 Backend API
- [ ] New API endpoint: `POST /handovers/return/api` (or extend `/handovers/new/api` with `type: 'return'`)
  - Creates handover record with `type: 'return'`
  - On `action: 'close'` → calls `returnVehicle()` from `vehicleStatus.service.ts`
- [ ] Update `GET /handovers/:id` to return correct document generator based on type
- [ ] Add validation: return handover requires existing assignment (driver must have vehicle)

#### 1.3 Frontend - Driver Detail Page (`src/routes/(admin)/drivers/[id]/+page.svelte`)
- [ ] Add **"Zwróć pojazd"** button when `driver.assignedVehicle` exists (next to "Szczegóły pojazdu")
- [ ] Button opens `NewHandoverProtocol` modal with:
  - `driver` prop (current driver)
  - `vehicle` prop (assigned vehicle)
  - `type: 'return'` prop (new)
- [ ] Modal pre-fills: registrationNumber, VIN, model, driver data from props

#### 1.4 Frontend - Handover Protocol Component (`NewHandoverProtocol.svelte`)
- [ ] Add `type?: 'assign' | 'return' | 'unilateral'` prop
- [ ] Conditional UI based on type:
  - **assign**: Shows vehicle/driver search (current behavior)
  - **return**: Pre-filled, read-only vehicle/driver; shows mileage, fuel, condition, equipment checklist
  - **unilateral**: Similar to return but different legal clauses
- [ ] On submit with `type === 'return'` → call return API endpoint
- [ ] Update `sendAction()` to handle return flow (`action: 'close'` → return API)

#### 1.5 Handover Fields Component (`HandoverProtocolFields.svelte`)
- [ ] Create return-specific fields: mileage (required), fuel/battery, visual condition, equipment checklist
- [ ] Reuse existing equipment booleans (key, spareKey, registration, roofSign, fuelCard, etc.)
- [ ] Add damage photos section (multiple categorized photos)

### 2. Camera System Rework

#### 2.1 Photo Categories for Handovers
Define structured photo types:
```typescript
type HandoverPhotoType = 
  | 'exterior_front' | 'exterior_rear' | 'exterior_left' | 'exterior_right'
  | 'interior_dashboard' | 'interior_front_seats' | 'interior_rear_seats'
  | 'odometer' | 'fuel_gauge' | 'damage_closeup' | 'equipment_checklist'
  | 'signed_document';
```

#### 2.2 New Components
- [ ] **`HandoverCameraCapture.svelte`** — Guided multi-step capture for handovers (like `CameraCaptureSeries` but for handover categories)
  - Stepper UI: exterior (4 sides) → interior (3) → odometer/fuel → damage → equipment → signed doc
  - Each step: overlay guide, required/optional, retake option
  - Output: `{ type: HandoverPhotoType; data: ArrayBuffer }[]`
- [ ] **`HandoverPhotoGallery.svelte`** — Review captured/uploaded photos by category before submit
  - Grid grouped by category
  - Allow re-take, delete, reorder
  - Show required vs optional badges

#### 2.3 Upload Pipeline
- [ ] Direct upload to final bucket (`feed-cdn-files` or dedicated handover bucket) — skip temp bucket
- [ ] Server-side processing endpoint: `/upload/handover-photos`
  - Accept multipart with `handoverId`, `type`, `category`
  - Generate thumbnail (WebP, max 800px)
  - Strip EXIF (GDPR: location data)
  - Return structured response: `{ originalUrl, thumbnailUrl, category, type }`
- [ ] Update `UploadHandoverImages.svelte` to use new pipeline
- [ ] Store photos in handover record as structured object:
  ```typescript
  images: {
    exterior_front: string;
    exterior_rear: string;
    // ...
    signed_document: string;
    _thumbnails: Record<string, string>;
  }
  ```

#### 2.4 Offline Support
- [ ] IndexedDB queue for captured photos when offline
- [ ] Service worker background sync on reconnect
- [ ] Visual indicator in UI (pending upload count)

#### 2.5 Cleanup Legacy
- [ ] Deprecate `CameraCapture.svelte` → use `MobileCameraCapture.svelte` everywhere
- [ ] Remove `UploadHandoverImages.svelte` → replace with `HandoverCameraCapture` + `HandoverPhotoGallery`
- [ ] Update `handover.zod.ts` `images` field to structured schema

### 3. Integration Points

#### 3.1 Driver Status Transitions
- [ ] Enable `active` → `available` transition in `driver.service.ts` (currently `false` — "disabled")
- [ ] Transition should ONLY be allowed via completed return handover (not direct status change)
- [ ] `DriverStatusChanger.svelte` should disable direct `active`→`available` dropdown option; show "Zwróć pojazd" button instead

#### 3.2 Vehicle Status
- [ ] `returnVehicle()` already sets vehicle status to `available` — verify this works
- [ ] Add `vehicleStatusChange` audit log entry for return (already in `changeVehicleStatus` but return uses direct transaction)

#### 3.3 Notifications (Deferred)
- [ ] Driver notification on assignment/return
- [ ] Admin notification on pending handovers
- [ ] Deferred to separate notifications plan

---

## File Map

| Area | Files to Modify | Files to Create |
|------|----------------|-----------------|
| Schema | `src/lib/assets/zodschemas/handover.zod.ts` | — |
| DB | `src/lib/server/db/firebase/vehicleHandovers.fdb.ts` | — |
| API | `src/routes/(admin)/handovers/new/api/+server.ts` | `src/routes/(admin)/handovers/return/api/+server.ts` |
| Service | — | (use existing `returnVehicle`) |
| UI - Driver Detail | `src/routes/(admin)/drivers/[id]/+page.svelte` | — |
| UI - Handover Modal | `src/lib/components/documents/NewHandoverProtocol.svelte` | — |
| UI - Fields | `src/lib/components/documents/HandoverProtocolFields.svelte` | `src/lib/components/documents/HandoverReturnFields.svelte` |
| Camera | `src/lib/form/UploadHandoverImages.svelte` | `src/lib/components/handover/HandoverCameraCapture.svelte`, `src/lib/components/handover/HandoverPhotoGallery.svelte` |
| Upload | `src/routes/upload/documents/+server.ts` | `src/routes/upload/handover-photos/+server.ts` |
| Document Gen | — | (use existing `handover-return.document.ts`) |

---

## Priority Order

1. **Handover Return Flow** (blocks driver status transitions)
   - Schema + DB + API + UI trigger + Modal integration
2. **Camera Rework - Core** (blocks photo evidence on returns)
   - Photo categories + guided capture + structured storage
3. **Camera Rework - Upload Pipeline**
   - Direct upload + thumbnails + EXIF strip
4. **Camera Rework - Offline & Cleanup**
   - IndexedDB queue + legacy removal

---

## Notes

- **Unilateral return** (driver abandoned vehicle): Separate flow, same return API but different PDF clauses, no driver signature required
- **Handover history**: Already tracked in `vehicleAssignment` collection (type: 'return') and `vehicleDriverStatusChange` collection
- **Testing**: Need E2E test for assign → return → assign cycle with photos
- **GDPR**: EXIF stripping mandatory; photos are personal data (vehicle linked to driver)

---

## Status Change Alignment (Critical)

Handover returns **must** atomically synchronize status changes across both entities with full audit trail:

### Driver Status Changes
- **Transition**: `active` → `available` (via return handover completion only — NOT direct)
- **Trigger**: `returnVehicle()` transaction completes successfully
- **Audit**: Write to `vehicleDriverStatusChange` collection:
  ```typescript
  {
    driverId: string,
    status: 'available',
    timestamp: Date.now(),
    userId: string,           // admin who closed handover
    userName: string,
    extraData: {
      reason: 'vehicle_return',
      handoverId: string,
      handoverType: 'return' | 'unilateral',
      previousVehicle: { registrationNumber, model },
      mileage: number,
      fuelLevel: string
    }
  }
  ```

### Vehicle Status Changes
- **Transition**: `assigned` → `available`
- **Trigger**: Same `returnVehicle()` transaction
- **Audit**: Write to `vehicleStatusChange` collection:
  ```typescript
  {
    vehicleId: string,
    status: 'available',
    timestamp: Date.now(),
    userId: string,
    userName: string,
    extraData: {
      reason: 'driver_return',
      handoverId: string,
      previousDriverId: string,
      previousDriverName: string,
      mileage: number,
      fuelLevel: string,
      conditionNotes: string
    }
  }
  ```

### Vehicle Assignment Record
- **Collection**: `vehicleAssignment`
- **Type**: `'return'`
- **Fields**: `registrationNumber`, `driverId`, `handoverId`, `timestamp`, `type: 'return'`

### Handover Record Updates
- `vehicleHandovers` document:
  - `closed: timestamp` (already set)
  - `returnedAt: timestamp` (already set in `returnVehicle()`)
  - `url: string` (signed DocuSign/PDF URL if applicable)
  - `images: HandoverImages` (structured photo object from camera rework)

### Implementation Location
- **Current**: `vehicleStatus.service.ts:returnVehicle()` handles vehicle + driver + assignment + handover updates in one transaction
- **Missing**: Audit log writes (`addVehicleDriverStatusChange`, `addVehicleStatusChange`) — must be added inside the same transaction
- **API**: Return handover API (`/handovers/return/api` action: 'close') calls `returnVehicle()` → audit logs happen automatically

### Validation Rules
- Return handover **cannot** be closed if:
  - Driver status ≠ `active` (must have vehicle assigned)
  - Vehicle status ≠ `assigned` (must be currently assigned to that driver)
  - Handover `type` ≠ `'return'` or `'unilateral'`
  - Required fields missing: mileage, fuel/battery, condition notes
- Direct status changes `active`→`available` (driver) or `assigned`→`available` (vehicle) **blocked** in `driver.service.ts` and `vehicleStatus.service.ts` — only allowed via completed return handover