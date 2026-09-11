import { EXPIRATION_THRESHOLD } from "$lib/assets/constants";
import { findVehiclesWithInsuranceExpiringBefore } from "$lib/server/db/firebase/vehicles.fdb";
import { findVehiclesWithTechnicalExpiringBefore } from "$lib/server/db/firebase/vehicles.fdb";


export const checkVehicleExpirationDates: HealthCheck.HealthCheckFn = async (
    params?: HealthCheck.HealthCheckParams
): Promise<HealthCheck.HealthIssue[]> => {
    const issues: HealthCheck.HealthIssue[] = [];
    
    let checkDate: string;
    if (params?.vehicles?.length) {
        checkDate = new Date().toISOString().split('T')[0];
    } else {
        const date = new Date();
        date.setDate(date.getDate() + EXPIRATION_THRESHOLD);
        checkDate = date.toISOString().split('T')[0];
    }

    const [ insuranceVehicles, technicalVehicles ] = await Promise.all([
        findVehiclesWithInsuranceExpiringBefore(checkDate, [ 'insuranceExpiration' ]),
        findVehiclesWithTechnicalExpiringBefore(checkDate, [ 'technicalExpiration' ])
    ]);

    const allVehicles = [ ...insuranceVehicles, ...technicalVehicles ];
    const seen = new Set<string>();
    const uniqueVehicles = allVehicles.filter(v => {
        if (seen.has(v.id)) return false;
        seen.add(v.id);
        return true;
    });

    for (const v of uniqueVehicles) {
        const insuranceDaysLeft = v.insuranceExpiration ? 
            Math.ceil((new Date(v.insuranceExpiration).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) : null;
        const technicalDaysLeft = v.technicalExpiration ? 
            Math.ceil((new Date(v.technicalExpiration).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) : null;

        if (insuranceDaysLeft !== null) {
            issues.push({
                id: `insurance-${v.id}`,
                type: 'insurance_expiring',
                severity: insuranceDaysLeft > 0 ? 'warning' : 'critical',
                entityType: 'vehicle',
                entityId: v.id,
                expirationDate: v.insuranceExpiration,
            });
        }

        if (technicalDaysLeft !== null) {
            issues.push({
                id: `technical-${v.id}`,
                type: 'technical_expiring',
                severity: technicalDaysLeft > 0 ? 'warning' : 'critical',
                entityType: 'vehicle',
                entityId: v.id,
                expirationDate: v.technicalExpiration,
            });
        }
    }

    return issues;
}