import type { HorizonSettings } from "../types";

export function createDefaultHorizonSettings(): HorizonSettings {
  return {
    radiusX: 220,
    radiusZ: 220,
    slots: 180,
    minHeight: 0.6,
    maxHeight: 4.5,
    minWidth: 2,
    maxWidth: 6,
    gapChance: 0.1,
    baseY: 0,
  };
}
