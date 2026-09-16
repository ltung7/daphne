import { DRIVER_STATUS } from "$lib/assets/enums";
import randomString from "$lib/utils/randomString";
import { getDriver, setDriver, updateDriver } from "../db/firebase/drivers.fdb";
import { getFirebaseAuth, revokeRefreshTokens, setCustomClaims } from '$lib/server/auth/firebaseAdmin.js';
import { validateDriverRequirements } from "$lib/assets/requirements";
import { error } from "@sveltejs/kit";
import { addVehicleDriverStatusChange } from "../db/firebase/vehicleDriverStatusChange.fdb";

type TransitionHandler = (driver: Driver.Driver, extraData: any) => Promise<boolean | void> | boolean | void;

const statusTransitions: Partial<Record<Driver.Status, Partial<Record<Driver.Status, TransitionHandler>>>> = {
    pending_verification: {
        available: (driver, extraData) => {
            if (!extraData.verificationResult) throw error(400, 'Missing verification data');
            const verified = validateDriverRequirements(extraData.verificationResult);
            if (!verified) throw error(400, 'Invalid verification');
            return true;
        },
        rejected: () => true
    },
    rejected: {
        pending_verification: () => true
    },
    available: {
        inactive: () => true,
        on_leave: () => false,
        documents_expired: () => false,
        suspended: () => false,
        banned: () => false,
        archived: () => true
    },
    active: {
        inactive: () => false,
        on_leave: () => false,
        documents_expired: () => false,
        suspended: () => false,
        banned: () => false,
        archived: () => false
    },
    inactive: {
        available: () => true,
        suspended: () => false,
        banned: () => false,
        archived: () => true
    },
    on_leave: {
        available: () => true,
        suspended: () => false,
        banned: () => false,
        archived: () => true
    },
    documents_expired: {
        available: () => false,
        suspended: () => false,
        banned: () => false,
        archived: () => true
    },
    suspended: {
        available: () => true,
        banned: () => false,
        archived: () => true
    },
    banned: {
        pending_verification: () => false,
        archived: () => true
    }
};

export const changeDriverStatus = async (driverOrId: string | Driver.Driver, newStatus: Driver.Status, extraData: any, user: App.User) => {
    const driver = typeof driverOrId === 'string' ? await getDriver(driverOrId) : driverOrId;
    if (!driver) throw error(404, 'Driver not found');

    const currentStatus = driver.status;
    if (currentStatus === newStatus) return { success: true, status: newStatus };

    const allowedTransitionsFromCurrent = statusTransitions[currentStatus];
    if (!allowedTransitionsFromCurrent) {
        throw error(400, `No transitions allowed from ${currentStatus}`);
    }

    const transitionHandler = allowedTransitionsFromCurrent[newStatus];
    if (!transitionHandler) {
        throw error(400, `Invalid status transition from ${currentStatus} to ${newStatus}`);
    }

    // Run custom checks
    try {
        const result = await transitionHandler(driver, extraData);
        if (result === false) {
            throw error(400, `Transition from ${currentStatus} to ${newStatus} is currently disabled or not fully implemented`);
        }
    } catch (err: any) {
        if (err?.status && err?.body?.message) throw err; // Re-throw SvelteKit errors
        throw error(400, `Failed to transition status: ${err.message || 'Unknown error'}`);
    }

    await updateDriver(driver.id, { status: newStatus });
    await addVehicleDriverStatusChange({ extraData, driverId: driver.id, status: newStatus, timestamp: Date.now(), userId: user.id, userName: user.name })
    
    // If driver is banned, revoke Firebase tokens and set custom claims for immediate effect
    if (newStatus === 'banned') {
        await revokeRefreshTokens(driver.id);
        await setCustomClaims(driver.id, { role: 'revoked' });
    }
    
    return { success: true, status: newStatus };
}

export const addNewDriver = async (newDriverData: Driver.NewDriverData, password?: string) => {
    const pwd = password || randomString(12, false);
    
    // Create Firebase Auth user first to get the UID
    const auth = getFirebaseAuth();
    const firebaseUser = await auth.createUser({
        email: newDriverData.email,
        password: pwd,
        displayName: newDriverData.name
    });
    
    const firebaseUid = firebaseUser.uid;
    
    // Use Firebase UID as the driver document ID
    const existing = await getDriver(firebaseUid);
    if (existing) {
        throw new Error("Driver with this Firebase UID already exists");
    }
    
    const now = Date.now();
    const driver: Driver.Driver = {
        ...newDriverData,
        id: firebaseUid,
        status: DRIVER_STATUS.PendingVerification,
        balance: 0,
        cashBalance: 0,
        assignedVehicle: false,
        earnings: 0,
        experience: 0,
        passengerRatings: 0,
        pendingWithdrawals: 0,
        profileImageUrl: '',
        safetyScore: 0,
        tripsCompleted: 0,
        uptimePercentage: 0,
        role: 'driver',
        timestamp: now,
        updatedAt: now,
        lastLoggedIn: 0
    }
    
    await setDriver(firebaseUid, driver);
    return { id: firebaseUid, password: pwd };
}