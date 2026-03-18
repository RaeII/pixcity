import type { BuildingSettings } from "../types";

//Edificio config
export const DEFAULT_BUILDING_SETTINGS: BuildingSettings = {
  color: "#9c9c9c",
  roughness: 0.84,
  metalness: 0.37,
};

export function createDefaultBuildingSettings(): BuildingSettings {
  return { ...DEFAULT_BUILDING_SETTINGS };
}
