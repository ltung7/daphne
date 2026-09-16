import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { findDrivers } from "$lib/server/db/firebase/drivers.fdb";
import { findVehicles } from "$lib/server/db/firebase/vehicles.fdb";
import { VEHICLE_STATUS } from "$lib/assets/enums";
import { isDev } from "$lib/utils/isDev";
import { getFleedProblemsSummary } from "$lib/server/services/health/healthCheck.service";

export const GET: RequestHandler = async ({ setHeaders }) => {
    const [ drivers, vehicles, problems ] = await Promise.all([
        findDrivers(),
        findVehicles(),
        getFleedProblemsSummary()
    ]);

    const totalDrivers = drivers.length;
    const activeDrivers = drivers.filter(d => d.status === 'active').length;
    const inactiveDrivers = drivers.filter(d => d.status === 'inactive').length;
    const onLeaveDrivers = drivers.filter(d => d.status === 'on_leave').length;
    const pendingDrivers = drivers.filter(d => d.status === 'pending_verification').length;
    const totalVehicles = vehicles.length;
    const availableVehicles = vehicles.filter(v => v.status === VEHICLE_STATUS.Available).length;
    const assignedVehicles = vehicles.filter(v => v.status === VEHICLE_STATUS.Assigned).length;
    const brokenVehicles = vehicles.filter(v => v.status === VEHICLE_STATUS.Broken).length;
    const maintenanceVehicles = vehicles.filter(v => v.status === VEHICLE_STATUS.UnderMaintenance).length;
    const precheckVehicles = vehicles.filter(v => v.status === VEHICLE_STATUS.Precheck).length;

    const totalEarnings = drivers.reduce((sum, d) => sum + (d.earnings || 0), 0);
    const totalBalance = drivers.reduce((sum, d) => sum + (d.balance || 0), 0);
    const totalTrips = drivers.reduce((sum, d) => sum + (d.tripsCompleted || 0), 0);


    if (isDev) {
        setHeaders({ "cache-control": "max-age=60000" });
    } else {
        setHeaders({ "cache-control": "max-age=300" });
    }

    return json({
        success: true,
        stats: {
            drivers: {
                total: totalDrivers,
                active: activeDrivers,
                inactive: inactiveDrivers,
                onLeave: onLeaveDrivers,
                pending: pendingDrivers
            },
            vehicles: {
                total: totalVehicles,
                available: availableVehicles,
                assigned: assignedVehicles,
                broken: brokenVehicles,
                maintenance: maintenanceVehicles,
                precheck: precheckVehicles
            },
            financial: {
                totalEarnings,
                totalBalance,
                totalTrips
            }
        },
        problems
    });
};