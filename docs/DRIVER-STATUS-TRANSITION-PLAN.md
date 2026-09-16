# Driver Status Transition Plan

## Current Statuses (from `Driver.Status` type & `DriverStatus.svelte`)

| Status | Category | Description |
|--------|----------|-------------|
| `pending_verification` | Onboarding | Initial state - documents submitted, awaiting review |
| `rejected` | Onboarding | Failed verification checks |
| `available` | Normal Lifecycle | Verified, waiting for vehicle assignment |
| `active` | Normal Lifecycle | Vehicle assigned, eligible to drive |
| `inactive` | Normal Lifecycle | Short-term pause (e.g., rest for the day). No reason/approval needed. |
| `on_leave` | Normal Lifecycle | Approved extended leave. Requires reason, dates, and vehicle return. |
| `documents_expired` | Compliance | Blocked from driving until renewed |
| `suspended` | Admin Action | Temporary block (investigation, safety incident, policy violation) |
| `banned` | Admin Action | Permanent removal |
| `archived` | Terminal | Account closed, kept for records |

---

## Detailed Transition Matrix

| From | To | Condition | Document / Trigger |
|------|----|-----------|--------------------|
| `pending_verification` | `available` | All required documents verified | Driver verification result |
| `pending_verification` | `rejected` | Verification failed | Admin action |
| `pending_verification` | `active` | **[Not possible]** Must be available first | N/A |
| `rejected` | `pending_verification` | Admin re-opens application | Admin action |
| `rejected` | *Other states* | **[Not possible]** Must go through verification | N/A |
| `available` | `active` | Vehicle assigned to driver | Handover Document (Assignment) |
| `available` | `inactive` | Driver takes a short break | Driver request (auto-approved) |
| `available` | `on_leave` | Scheduled date (`dateFrom`) reached OR Admin immediate override | Leave Record (DB) + Leave PDF |
| `available` | `documents_expired`| One or more required documents expired | System Job |
| `available` | `suspended` | Policy violation, investigation | Admin action |
| `available` | `banned` | Severe violation | Admin action |
| `available` | `archived` | Account closed | Admin action |
| `active` | `available` | Vehicle returned | Handover Document (Return / Unilateral) |
| `active` | `inactive` | Driver takes a short break (keeps vehicle assigned) | Driver request (auto-approved) |
| `active` | `on_leave` | Scheduled date (`dateFrom`) reached OR Admin immediate override | Handover Document (Return) + Leave Record (DB) + Leave PDF |
| `active` | `documents_expired`| Document expired, vehicle must be returned | Handover Document (Forced Return) + System Job |
| `active` | `suspended` | Policy violation, investigation | Admin action + Handover Document (Return) |
| `active` | `banned` | Severe violation | Admin action + Handover Document (Return) |
| `active` | `archived` | Account closed | Admin action + Handover Document (Return) |
| `inactive` | `available` | Driver resumes work (no vehicle was assigned) | Driver request / Auto-resume |
| `inactive` | `active` | Driver resumes work (vehicle remained assigned) | Driver request / Auto-resume |
| `inactive` | `suspended` | Policy violation discovered | Admin action |
| `inactive` | `banned` | Severe violation discovered | Admin action |
| `inactive` | `archived` | Account closed | Admin action |
| `on_leave` | `available` | Leave ends/cancelled (no vehicle assigned) | End date reached / Admin action |
| `on_leave` | `active` | Leave ends/cancelled and immediately assigned a vehicle | Handover Document (Assignment) |
| `on_leave` | `suspended` | Policy violation discovered | Admin action |
| `on_leave` | `banned` | Severe violation discovered | Admin action |
| `on_leave` | `archived` | Account closed | Admin action |
| `documents_expired` | `available` | Documents renewed (no vehicle assigned) | Driver verification result |
| `documents_expired` | `active` | Documents renewed and immediately assigned a vehicle | Driver verification result + Handover Document |
| `documents_expired` | `suspended` | Policy violation discovered | Admin action |
| `documents_expired` | `banned` | Severe violation discovered | Admin action |
| `documents_expired` | `archived` | Account closed | Admin action |
| `suspended` | `available` | Suspension lifted (no vehicle assigned) | Admin action |
| `suspended` | `active` | Suspension lifted and immediately assigned a vehicle | Admin action + Handover Document |
| `suspended` | `banned` | Escalated to permanent ban | Admin action |
| `suspended` | `archived` | Account closed | Admin action |
| `banned` | `archived` | Account closed/record keeping | Admin action |
| `banned` | `pending_verification` | Admin re-evaluates and allows re-application | Admin action |
| `banned` | `available` / `active` | **[Not possible]** Must go through verification | N/A |
| `archived` | *Any* | **[Not possible]** Terminal state | N/A |

---

## State Transition Graph

```mermaid
stateDiagram-v2
    [*] --> pending_verification : Driver created
    
    %% Onboarding
    pending_verification --> rejected : Verification failed (admin)
    pending_verification --> available : All required docs verified
    rejected --> pending_verification : Admin re-opens
    
    %% Vehicle assignment
    available --> active : Handover document (assignment) signed by manager
    active --> available : Handover document (return/unilateral) signed by manager
    
    %% Driver-initiated pause (Short break)
    active --> inactive : Driver rests (keeps vehicle)
    available --> inactive : Driver rests (no vehicle)
    inactive --> active : Driver resumes work
    inactive --> available : Driver resumes work

    %% Driver on leave (Extended)
    active --> on_leave : Start date reached OR Admin immediate action (+ Vehicle returned)
    available --> on_leave : Start date reached OR Admin immediate action
    on_leave --> active : Driver returns + Manager assigns vehicle
    on_leave --> available : Driver returns + no vehicle
    
    %% Compliance-driven (document expiry)
    active --> documents_expired : Document expires
    available --> documents_expired : Document expires
    documents_expired --> active : All docs renewed + has vehicle
    documents_expired --> available : All docs renewed + no vehicle
    
    %% Admin actions
    active --> suspended : Admin suspends (violation/investigation)
    available --> suspended : Admin suspends
    documents_expired --> suspended : Admin suspends
    inactive --> suspended : Admin suspends
    on_leave --> suspended : Admin suspends
    suspended --> active : Admin lifts + has vehicle
    suspended --> available : Admin lifts + no vehicle
    suspended --> banned : Admin escalates
    active --> banned : Admin bans
    available --> banned : Admin bans
    suspended --> banned : Admin escalates
    
    %% Terminal
    banned --> archived : Admin archives
    banned --> pending_verification : Admin allows re-evaluation
    inactive --> archived : Admin archives (driver leaves)
    on_leave --> archived : Admin archives (driver leaves)
    active --> archived : Admin archives
    available --> archived : Admin archives
```

---

## Transition Criteria & Requirements

### 1. `pending_verification` → `available` (Onboarding Completion)

**Trigger:** All **required** driver requirements verified

**Required Documents (from `driverRequirements` where `required: true`):**
- `drivingLicenseFront` - Prawo jazdy (awers)
- `drivingLicenseBack` - Prawo jazdy (rewers)
- `polishCriminalRecordCertificate` - Zaświadczenie o niekaralności (PL) - *required for PL citizens*
- `foreignCriminalRecordCertificate` - Zaświadczenie o niekaralności (zagranica) - *required for foreigners*
- `medicalCertificate` - Zaświadczenie lekarskie
- `psychologicalCertificate` - Zaświadczenie psychologiczne
- `taxiDriverIdFront` - Legitymacja TAXI (awers)
- `taxiDriverIdBack` - Legitymacja TAXI (rewers)

**Conditional (one of these sets):**
- `idCardFront` + `idCardBack` (Polish citizens)
- `passportMainPage` + `residencePermitFront` + `residencePermitBack` (Non-EU foreigners)
- `passportMainPage` + `idCardFront` + `idCardBack` (EU foreigners)

**Validation:** `verifyDriverRequirements(driver, documents)` returns `true` for all required nodes
**API:** `PATCH /drivers/:id/status` with `{ status: 'available', verificationResult }`

---

### 2. `available` ↔ `active` (Vehicle Assignment/Return)

**Assignment (`available` → `active`):**
- **Trigger:** Manager creates & signs **Handover Document** (type: `assignment`)
- **Document:** `NewHandoverProtocol` component
- **Requirements:** 
  - Vehicle must be in `available` status
  - Vehicle must pass all `vehicleRequirements` for intended service(s)
  - Driver must be in `available` status
- **Result:** `driver.assignedVehicle = vehicleId`, `driver.status = 'active'`, `vehicle.status = 'assigned'`

**Return (`active` → `available`):**
- **Trigger:** Manager creates & signs **Handover Document** (type: `return` or `unilateral`)
- **Types:**
  - `return` - Normal return, both parties sign
  - `unilateral` - One-sided return (e.g., driver abandoned vehicle)
- **Result:** `driver.assignedVehicle = false`, `driver.status = 'available'`, `vehicle.status = 'available'`

---

### 3. `active`/`available` ↔ `inactive`/`on_leave` (Driver-Initiated Pause / Leave)

**Short Break (`active`/`available` ↔ `inactive`):**
- **Trigger (To `inactive`):** Driver requests temporary pause (e.g., done for the day).
- **Requirements:** None. No reason or manager approval required. 
  - If `active`: Vehicle *remains assigned* to the driver. Handover return is NOT required.
- **Result:** `driver.status = 'inactive'`.
- **Trigger (To `active`/`available`):** Driver manually toggles back or auto-resumes next day.
  - Returns to `active` if they kept their vehicle, or `available` if they didn't have one.

**Extended Leave (`active`/`available` ↔ `on_leave`):**
- **The Leave Artifacts:** Every leave requires creating a DB record and generating a PDF document. These must contain: `dateFrom`, `dateEnd`, `approvedBy` (Admin ID), and a `note` (reason).
- **Standard Flow (Scheduled):**
  - **Request:** Driver requests leave, providing a reason and specific dates.
  - **Approval:** Management approves. The DB record and PDF are generated.
  - **Trigger (To `on_leave`):** Status does **not** change immediately upon approval. A scheduled job changes the status to `on_leave` on `dateFrom`.
  - **Requirements:** If the driver is `active`, the vehicle **must be returned** (via Handover Return protocol) on or before `dateFrom`.
- **Admin Immediate Override:**
  - **Trigger (To `on_leave`):** Admin manually places the driver on leave immediately.
  - **Effect:** Implicitly auto-approves the leave, instantly creates the DB record & PDF (with `dateFrom` as today), and changes the status to `on_leave` right away. Vehicle must be returned immediately if `active`.
- **Resume (To `active`/`available`):**
  - **Trigger:** Leave `dateEnd` is reached (handled by scheduled job) OR Admin manually resumes the driver early.
  - **Requirements:**
    - All documents still valid (not expired).
    - Driver transitions to `available`. To become `active` again, a new Handover Assignment protocol must be signed.

---

### 4. Document Expiry Flow (Compliance)

**Monitoring:** Background job checks document expirations daily

**`active`/`available` → `documents_expired`:**
- **Trigger:** Document expires (date passed)
- **Effect:** Driver **blocked from driving** - cannot receive orders
- If `active`: Vehicle must be returned (forced handover return)

**`documents_expired` → `active`/`available`:**
- **Trigger:** All expired documents renewed + verified
- **Requirements:** New documents uploaded, `verifyDriverRequirements()` passes
- **Result:** Status restored based on vehicle assignment

---

### 5. Admin Actions (Suspend/Ban/Archive)

| From | To | Trigger | Notes |
|------|-----|---------|-------|
| Any (except banned/archived) | `suspended` | Admin action: investigation, safety incident, policy violation | Temporary, reversible |
| `suspended` | `active`/`available` | Admin lifts suspension | Restore based on vehicle |
| `suspended` | `banned` | Admin escalates after investigation | Permanent |
| Any (except archived) | `banned` | Admin: severe violations, fraud, safety | Terminal, but can be reset to `pending_verification` |
| `banned` | `pending_verification` | Admin re-evaluates ban | Requires full re-verification |
| Any | `archived` | Admin: driver leaves fleet, account closure | Terminal, read-only |

---

### 6. `pending_verification` ↔ `rejected`

**Rejection (`pending_verification` → `rejected`):**
- **Trigger:** Admin reviews and rejects onboarding
- **Reasons:** Failed background check, invalid documents, duplicate application
- **Effect:** Application closed. Cannot be changed unless Admin intervenes.

**Re-open (`rejected` → `pending_verification`):**
- **Trigger:** Admin manually re-opens the application.
- **Effect:** Driver goes back to the beginning of the onboarding pipeline.

---

## Implementation Checklist

### Backend (Server)
- [ ] Add status transition validation in `driver.service.ts` (or new `driverStatus.service.ts`)
- [ ] Enforce transition rules (e.g., can't go `pending_verification` → `active` directly)
- [ ] Add audit log for each status change (who, when, reason)
- [ ] Create scheduled job for document expiry monitoring
- [ ] Add webhook/notification for status changes

### Frontend (UI)
- [ ] Update `DriverVerification.svelte` to show clear progress (already done)
- [ ] Add status transition UI in driver detail page (dropdown with valid next states only)
- [ ] Show handover document modal for `available`↔`active` transitions
- [ ] Add document expiry warnings in driver list/detail
- [ ] Admin actions modal for suspend/ban/archive with reason field

### Database
- [ ] Ensure `Driver` model has `statusHistory` array for audit trail
- [ ] Add indexes for querying by status (for listing drivers by status)
