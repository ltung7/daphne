# Handover Return & Unilateral Return Implementation Plan

## Overview
Implement voluntary return and unilateral return workflows for vehicle handovers.

### Core Handover & Status Rules (CRITICAL)
1. **Handover documents do not apply to the status transition matrix**: All handover document workflows (assignment, voluntary return, unilateral return) operate independently of the `statusTransitions` matrix and change vehicle status directly with appropriate audit logging.
2. **Deterministic status calculation (no `targetStatus` parameter)**:
   - Returning does NOT accept a `targetStatus` from the client/manager.
   - Status transitions automatically: **status stays the same unless it was `'assigned'` — if `'assigned'`, it becomes `'available'`**.
   - If the vehicle was already `'unmovable'` (e.g., automatically flagged by health check background jobs for expired inspection or insurance), `'under_maintenance'`, or `'broken'`, it retains that exact status upon return—it is simply unassigned from the driver.
3. **Status applied atomically via transaction**: Vehicle status change is executed within the Firestore transaction alongside clearing assignment fields, matching the pattern in `assignVehicleAndCloseHandover`.
4. **Use `timestamp` instead of `returnedAt`**: Every handover document is an independent record in `vehicleHandovers` (with its own `type: 'assign' | 'return' | 'unilateral'`). Closing a return document simply sets `closed: timestamp` (and `timestamp` of the document). There is no need for duplicate fields like `returnedAt`.
5. **Returning does not require status `'assigned'`**: A vehicle may be returned when already `'broken'`, `'under_maintenance'`, or legally `'unmovable'`.
6. **Meaning of `'assigned'` status**: The `'assigned'` status strictly indicates that the vehicle has passed all legal/technical checks, is actively assigned to an authorized driver, and is ready to earn on platforms.

---

## Type Changes (src/app.d.ts)

### 1. Vehicle interface (line 233)
Add `handoverId?: string` field to track which handover document assigned this vehicle.

```typescript
interface Vehicle extends NewVehicleData {
    // ... existing fields
    assignedDriverName?: string;
    assignedDriverId?: string;
    handoverId?: string;  // link to handover document
    // ...
}
```

### 2. Driver.assignedVehicle (line 634)
Add `handoverId: string` to the assignedVehicle object.

```typescript
assignedVehicle: false | {
    registrationNumber: string;
    model: string;
    imageUrl?: string;
    timestamp: number;
    handoverId: string;  // link to handover document
}
```

### 3. HandoverDocumentRecord (line 802)
Extend with ONLY the specific unilateral fields needed (since return logic creates a NEW document of type 'return' or 'unilateral', it automatically inherits the base `HandoverDocument` fields for mileage, fuel, visual condition, location, and manager/retriever).

Add `handoverId?: string` to both return and unilateral handover documents — this stores the ID of the original assignment handover document that this return/unilateral document reverses.

```typescript
interface HandoverDocumentRecord extends HandoverDocument {
    // ... existing fields
    
    // Return/Unilateral: link to the original assignment handover being reversed
    handoverId?: string;
    
    // Unilateral fields (uses base HandoverDocument for mileage, fuel, place, etc.)
    witness?: string;
    reasonForRecovery?: string;
    foundItems?: string[]; // Driver's personal items found in vehicle
}
```

---

## Service Changes (src/lib/server/services/vehicleStatus.service.ts)

### 1. Update `assignVehicleAndCloseHandover` (already completed)
Saves `handoverId` on both Vehicle and Driver and sets `status: 'assigned'` inside transaction.

### 2. Update `returnVehicle` -> `returnVehicleAndCloseHandover`
Atomically closes a voluntary return handover, clears driver assignment, determines new status, and updates vehicle status in the transaction.

```typescript
export interface ReturnVehicleData {
    registrationNumber: string;
    driverId?: string;
    handoverId: string;
    user?: App.User;
    uploadedDocumentUrl?: string;
}

export async function returnVehicleAndCloseHandover(data: ReturnVehicleData): Promise<{ success: boolean; assignmentId?: string; error?: string }>
```

Steps:
1. Fetch vehicle document:
   - Verify vehicle exists and is currently assigned to `driverId` (reads from vehicle if not passed).
   - Calculate new status: `const newStatus = vehicle.status === 'assigned' ? 'available' : vehicle.status;`
2. Firestore Transaction:
   - **Vehicle (`vehicles/{reg}`)**: Delete `assignedDriverId`, `assignedDriverName`, `handoverId` via `FieldValue.delete()`, set `status: newStatus`, `updatedAt: timestamp`.
   - **Driver (`vehicleDriver/{driverId}`)**: Set `assignedVehicle: false`, `updatedAt: timestamp`.
   - **Assignment (`vehicleAssignment`)**: Add record `{ registrationNumber, driverId, handoverId, timestamp, type: 'return' }`.
   - **Handover (`vehicleHandovers/{handoverId}`)**: Set `closed: timestamp`, `updatedAt: timestamp`, and `url` if uploaded.
3. Audit Log:
   - If status changed (or on return event), log to `vehicleStatusChange` via `addVehicleStatusChange`.

### 3. Add `unilateralReturnVehicleAndCloseHandover`
Atomically closes a unilateral recovery handover, clears driver assignment, determines new status, and updates vehicle status in the transaction.

```typescript
export interface UnilateralReturnVehicleData {
    registrationNumber: string;
    driverId?: string;
    handoverId: string;
    user?: App.User;
    uploadedDocumentUrl?: string;
}

export async function unilateralReturnVehicleAndCloseHandover(data: UnilateralReturnVehicleData): Promise<{ success: boolean; assignmentId?: string; error?: string }>
```

Steps:
1. Fetch vehicle document:
   - Verify vehicle exists and is assigned to `driverId` (reads from vehicle if not passed).
   - Calculate new status: `const newStatus = vehicle.status === 'assigned' ? 'available' : vehicle.status;`
2. Firestore Transaction:
   - **Vehicle (`vehicles/{reg}`)**: Delete `assignedDriverId`, `assignedDriverName`, `handoverId` via `FieldValue.delete()`, set `status: newStatus`, `updatedAt: timestamp`.
   - **Driver (`vehicleDriver/{driverId}`)**: Set `assignedVehicle: false`, `updatedAt: timestamp`.
   - **Assignment (`vehicleAssignment`)**: Add record `{ registrationNumber, driverId, handoverId, timestamp, type: 'unilateral' }`.
   - **Handover (`vehicleHandovers/{handoverId}`)**: Set `closed: timestamp`, `updatedAt: timestamp`, and `url` if uploaded.
3. Audit Log:
   - Log status transition to `vehicleStatusChange` via `addVehicleStatusChange`.

---

## Full Endpoints & UI Routes

### 1. /handovers/[id]/return
Full endpoint implemented:
- `+page.server.ts`: Loads handover document, associated vehicle, and driver.
- `+page.svelte`: Header with link to `/handovers/[id]/unilateral` and back to `/handovers/[id]`; uses `NewReturnHandoverProtocol` with prefilled data.
- `api/+server.ts`: Handles `save`, `pdf` (`generateHandoverReturnDocument`), and `close` (`returnVehicleAndCloseHandover`).

### 2. /handovers/[id]/unilateral
Full endpoint implemented:
- `+page.server.ts`: Loads handover document, associated vehicle, and driver.
- `+page.svelte`: Header with link to `/handovers/[id]/return` and back to `/handovers/[id]`; uses `NewReturnHandoverProtocol` with `unilateral={true}`.
- `api/+server.ts`: Handles `save`, `pdf` (`generateHandoverUnilateralDocument`), and `close` (`unilateralReturnVehicleAndCloseHandover`).

---

## PDF Document Templates

### Unilateral Document - Items Found Page
- File: `src/lib/documents/handover-unilateral.documents.ts`
- Render `foundItems` list in `generateHandoverUnilateralDocument` after Section 4 (Visual/Notes) and before clauses/signatures.

---

## Implementation Todo List

### Phase 1: Type Definitions
- [x] Add `handoverId?: string` to Vehicle interface (`src/app.d.ts:241`)
- [x] Add `handoverId: string` to Driver.assignedVehicle (`src/app.d.ts:640`)
- [x] Extend HandoverDocumentRecord with return/unilateral fields (`src/app.d.ts:811-813`)
- [x] Add `foundItems?: string[]` to HandoverDocumentRecord for unilateral

### Phase 2: Service Layer (`src/lib/server/services/vehicleStatus.service.ts`)
- [x] Update `assignVehicleAndCloseHandover` to save `handoverId` on Vehicle and Driver
- [x] Update `returnVehicle` to `returnVehicleAndCloseHandover` (deterministic status: `assigned` -> `available`, otherwise unchanged; update status in transaction; use `closed: timestamp`)
- [x] Add `unilateralReturnVehicleAndCloseHandover` (deterministic status, update status in transaction, use `closed: timestamp`)

### Phase 3: Full Endpoints & UI Routes
- [x] Create `NewReturnHandoverProtocol.svelte` for return & unilateral protocols (keeping `NewHandoverProtocol.svelte` clean for initial handovers)
- [x] Create `src/routes/(admin)/handovers/[id]/return/` (`+page.server.ts`, `+page.svelte`, `api/+server.ts`)
- [x] Create `src/routes/(admin)/handovers/[id]/unilateral/` (`+page.server.ts`, `+page.svelte`, `api/+server.ts`)
- [x] Cross-link headers between return and unilateral pages

### Phase 4: Unilateral Document - Items Found Section & UI Form
- [ ] Update `src/lib/documents/handover-unilateral.documents.ts` to render `foundItems`
- [ ] Build unilateral recovery form in `src/routes/(admin)/handovers/[id]/unilateral/+page.svelte`

### Phase 5: Testing & Verification
- [x] Run type-check: `npm run check` (0 errors, 0 warnings)
- [ ] Run lint: `npm run lint`
- [ ] Test return workflow end-to-end
- [ ] Test unilateral workflow end-to-end
