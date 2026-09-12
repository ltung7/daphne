import { DRIVER_STATUS } from "$lib/assets/enums";
import randomString from "$lib/utils/randomString";
import { getDriver, setDriver } from "../db/firebase/drivers.fdb";
import { getFirebaseAuth } from '$lib/server/auth/firebaseAdmin.js';

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