# Handover Return & Unilateral Return Implementation Plan

## Overview
Implement voluntary return and unilateral return workflows for vehicle handovers. Both require vehicle status transition from `assigned` to target status (`available` | `under_maintenance` | `broken` | `unmovable`).

---

## Type Changes (src/app.d.ts)

### 1. Vehicle interface (line 233)
Add `assignedHandoverId?: string` field to track which handover document assigned this vehicle.

```typescript
interface Vehicle extends NewVehicleData {
    // ... existing fields
    assignedDriverName?: string;
    assignedDriverId?: string;
    assignedHandoverId?: string;  // NEW: link to handover document
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
    handoverId: string;  // NEW: link to handover document
}
```

### 3. HandoverDocumentRecord (line 802)
Extend with return/unilateral fields per plan:

```typescript
interface HandoverDocumentRecord extends HandoverDocument {
    // ... existing fields
    // Return fields
    returnedAt?: number;
    returnMileage?: number;
    returnFuel?: number;
    returnVisual?: string;
    returnNotes?: string;
    
    // Unilateral fields
    recoveryLocation?: string;
    witness?: string;
    reasonForRecovery?: string;
    retriever?: string;
}
```

---

## Service Changes (src/lib/server/services/vehicleStatus.service.ts)

### 1. Update `assignVehicleAndCloseHandover` (line 27)
Save `handoverId` on both Vehicle and Driver:

```typescript
// Vehicle update
const updateVehicleData: Partial<Vehicle.Vehicle> = {
    assignedDriverId: driverId,
    assignedDriverName: driverName,
    assignedHandoverId: handoverId,  // NEW
    status: 'assigned'
}

// Driver update
const updateDriverData: Partial<Driver.Driver> = {
    assignedVehicle: {
        model,
        registrationNumber,
        timestamp,
        handoverId  // NEW
    }
}
```

### 2. Update `returnVehicle` (line 152)
Read `handoverId` from Vehicle (or Driver) instead of requiring it as parameter. Add status transition.

```typescript
export async function returnVehicle(
    registrationNumber: string, 
    driverId: string, 
    options: {
        targetStatus: 'available' | 'under_maintenance' | 'broken' | 'unmovable';
        mileage?: number;
        fuel?: number;
        notes?: string;
        handoverId?: string;  // optional fallback
        user: App.User;
    }
): Promise<{ success: boolean; assignmentId?: string; error?: string }>
```

Steps:
1. Get vehicle to read `assignedHandoverId` (fallback to options.handoverId)
2. Call `handleChangeVehicleStatus(vehicle, targetStatus, extraData, user)`
3. Transaction: clear assignments + create assignment record type 'return' + update handover with return data

### 3. Add `unilateralReturnVehicle` (NEW function)

```typescript
export async function unilateralReturnVehicle(
    registrationNumber: string,
    driverId: string,
    options: {
        targetStatus: 'available' | 'under_maintenance' | 'broken' | 'unmovable';
        recoveryData: {
            recoveryLocation: string;
            witness: string;
            reasonForRecovery: string;
            retriever: string;
            mileage?: number;
            fuel?: number;
            visual?: string;
        };
        handoverId?: string;  // optional fallback
        user: App.User;
    }
): Promise<{ success: boolean; assignmentId?: string; error?: string }>
```

Steps:
1. Get vehicle to read `assignedHandoverId`
2. Call `handleChangeVehicleStatus(vehicle, targetStatus, extraData, user)`
3. Transaction: clear assignments + create assignment record type 'unilateral' + update handover with unilateral data

---

## API Endpoints

### 1. POST /handovers/[id]/return
Create new file: `src/routes/(admin)/handovers/[id]/return/+server.ts`

```typescript
// Body: { targetStatus, mileage?, fuel?, notes? }
// Validates: handover.closed === true (vehicle currently assigned)
// Calls: returnVehicle() with handoverId from params.id
```

### 2. POST /handovers/[id]/unilateral
Create new file: `src/routes/(admin)/handovers/[id]/unilateral/+server.ts`

```typescript
// Body: { targetStatus, recoveryData: { recoveryLocation, witness, reasonForRecovery, retriever, mileage?, fuel?, visual? } }
// Validates: handover.closed === true
// Calls: unilateralReturnVehicle() with handoverId from params.id
```

---

## Validation Rules

1. **Only allowed if** `handover.closed === true` (vehicle currently assigned)
2. **Target status** must be one of: `available`, `under_maintenance`, `broken`, `unmovable`
3. **Role checks** via `handleChangeVehicleStatus` (moderator can return to all four statuses)
4. **Manager/Admin** choose target status based on vehicle condition at return

---

## Notifications (per plan)
- Driver notified of return completion
- Managers notified if vehicle goes to `unmovable`/`broken`

---

## Files to Create/Modify

| File | Action |
|------|--------|
| `src/app.d.ts` | Add `assignedHandoverId` to Vehicle, `handoverId` to Driver.assignedVehicle, extend HandoverDocumentRecord |
| `src/lib/server/services/vehicleStatus.service.ts` | Update `assignVehicleAndCloseHandover`, update `returnVehicle`, add `unilateralReturnVehicle` |
| `src/routes/(admin)/handovers/[id]/return/+server.ts` | NEW - voluntary return endpoint |
| `src/routes/(admin)/handovers/[id]/unilateral/+server.ts` | NEW - unilateral return endpoint |

---

## Dependencies
- Existing: `handleChangeVehicleStatus`, `vehicleStatusChange` audit log, `vehicleAssignment` collection
- Existing: `getVehicle`, `updateVehicle`, `getDriver`, `updateDriver` from firebase db modules
- Existing: Handover PDF templates (`generateHandoverDocument` for return/unilateral types)

---

## Additional Requirements (Added Later)

### Unilateral Document - Items Found Page
**Requirement**: Unilateral handover requires a new page listing driver's personal items found in the vehicle.

**Reason**: Since it's unilateral (driver absent/unreachable), they cannot retrieve their belongings. For legal protection, we must document all items found in the vehicle at time of recovery.

**Implementation**:
- Add `foundItems: string[]` field to unilateral handover data
- Add new section/page in `generateHandoverUnilateralDocument` after Section 4 (Visual/Notes)
- Section header: "Przedmioty znalezione w pojeździe" (Items found in vehicle)
- Render as numbered list or bullet points
- Include in PDF before clauses/signatures

**Data Model Update** (src/app.d.ts - HandoverDocumentRecord):
```typescript
// Unilateral fields (add foundItems)
foundItems?: string[];  // NEW: driver's personal items found in vehicle
```

**API Update**: Include `foundItems` in unilateral endpoint body validation.