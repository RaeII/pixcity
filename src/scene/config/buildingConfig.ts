import type { BuildingSettings } from "../types";

export const DEFAULT_BUILDING_SETTINGS: BuildingSettings = {
  color: "#fffdf8",
  roughness: 0.97,
  metalness: 0.03,
};

export function createDefaultBuildingSettings(): BuildingSettings {
  return { ...DEFAULT_BUILDING_SETTINGS };
}
