import type { BuildingSettings } from "../types";

//Edificio config
export const DEFAULT_BUILDING_SETTINGS: BuildingSettings = {
  color: "#ffffff",  // neutral tint — Skyline gray palette shows through
  roughness: 0.95,   // Skyline matte finish
  metalness: 0.05,   // Skyline matte finish
};

export function createDefaultBuildingSettings(): BuildingSettings {
  return { ...DEFAULT_BUILDING_SETTINGS };
}
