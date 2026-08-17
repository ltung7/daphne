export enum FUEL_TYPE {
    Gasoline = "gasoline",
    Hybrid = "hybrid",
    Electric = "electric",
    PlugInHybrid = "phev",
    MildHybrid = "mhev",
    Diesel = "diesel",
    NaturalGas = "cng",
    HybridGasoline = "hybrid-gasoline",
    MildHybridDiesel = "mhev-diesel",
    Ethanol = "ethanol",
    HybridDiesel = "hybrid-diesel",
    Lpg = "lpg",
    Hydrogen = "hydrogen"
}

export const ECO_FUEL_TYPES: Vehicle.FuelType[] = [
    "electric",
    "hybrid",
    "phev",
    "hybrid-gas",
    "hybrid-diesel",
    "hydrogen",
];